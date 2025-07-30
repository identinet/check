use serde_json::from_str;
use ssi::claims::vc::v1::JsonPresentation;
use ssi::dids::DIDResolver as _;
use ssi::dids::{
    document::{service::Endpoint, Service},
    resolution::Output,
    AnyDidMethod, DIDBuf, Document,
};
use ssi::json_ld::syntax::Value;
use tokio::task::JoinSet;
use url::Url;

use verification_service::dto::{VerificationResponseDto, VerificationResult};
use verification_service::{verify_did_configuration_vc, verify_presentations, WellKnownDidConfig};

type DidDocument = Output;

/// Verification error.
#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    /// URL is not supported
    #[error("URL not supported: {0}")]
    UrlNotSupported(String),

    #[error("Unexpected error: {0}")]
    Unexpected(String),

    /// Unable to resolve DID document
    #[error("DID could not be resolved")]
    ResolutionFailure(#[from] ssi::dids::resolution::Error),

    /// Unable to verify DID configuration
    #[error("DID Configuration invalid: {0}")]
    DidConfigInvalid(String),
}

/// Verifies the given URL
pub async fn verify_by_url(url: &Url) -> Result<VerificationResponseDto, ServiceError> {
    let dids = match url.scheme() {
        "did" => DIDBuf::from_string(url.to_string())
            .map(|did| vec![did])
            .unwrap(),
        _ => lookup_dids(url).await?,
    };

    let tasks: JoinSet<_> = dids
        .into_iter()
        .map(|did| async move { return resolve_did(&did).await })
        .collect();

    let results = tasks.join_all().await;

    // Use `partition` to split the results into Ok and Err vectors
    let (oks, errs): (Vec<_>, Vec<_>) = results.into_iter().partition(|r| r.is_ok());

    // If there is no successful result return the first error
    if oks.is_empty() {
        let e = match errs.into_iter().next() {
            Some(r) => r.err().unwrap(), // unwrapping is safe as `errs` partition contains only Err
            None => ServiceError::Unexpected("Neither results nor errors found".to_owned()), // return general error in case there are also no error results
        };
        return Err(e);
    }

    // Collect all successfully resolved DID documents
    let did_documents: Vec<Document> = oks
        .into_iter()
        .filter_map(|r| r.ok())
        .map(|out| out.document.into_document())
        .collect();

    let mut dto = VerificationResponseDto {
        documents: did_documents.clone(),
        credentials: Vec::new(),
        results: Vec::new(),
        verified: false,
    };

    for did_doc in &did_documents {
        let linked_presentations = fetch_all_linked_presentations(&did_doc.service).await;
        for presentation in &linked_presentations {
            let vcs = presentation.verifiable_credentials.clone();
            dto.credentials.extend(vcs);
        }

        // verify VPs and nested VCs
        let verification_results = verify_presentations(linked_presentations, &did_doc.id).await;
        dto.results.extend(verification_results);
    }

    dto.verified = dto
        .results
        .iter()
        .all(|result| matches!(result, VerificationResult::VcValid(_)));

    Ok(dto)
}

/// Performs a DID document lookup based on the DIDs attached to the given URL
/// We check if there is a DID well-known config at the given URL to lookup the
/// DID. If this fails we fall back to did:web representation of the given URL.
async fn lookup_dids(url: &Url) -> Result<Vec<DIDBuf>, ServiceError> {
    // test if there's a well-known DID config for given url
    let config_json = match lookup_did_config(url).await {
        Ok(config) => config,
        // lookup failed, fall back to did web
        Err(()) => return url_to_didweb(url),
    };

    // verify DID config VC
    let config = match verify_did_configuration_vc(&config_json, url).await {
        Ok(_) => serde_json::from_slice::<WellKnownDidConfig>(config_json.as_bytes())
            .map_err(|_| ServiceError::Unexpected(String::new())), // not expected as verify_did_config_vc would have failed already if DID config could not be parsed
        Err(e) => Err(match e {
            VerificationResult::DidConfigError(p) => ServiceError::DidConfigInvalid(p.details),
            _ => ServiceError::DidConfigInvalid(serde_json::to_string(&e).unwrap()),
        }),
    }?;

    // extract did from config
    match config_to_dids(&config) {
        // extraction failed, fall back to did web
        v if v.is_empty() => url_to_didweb(url),
        v => Ok(v),
    }
}

/// Downloads the DID well-known config from the given URL
/// <https://identity.foundation/specs/did-configuration>/
async fn lookup_did_config(url: &Url) -> Result<String, ()> {
    let well_known_uri = url_to_well_known_config_uri(url)?;
    // TODO: handle JWT proof format
    let response = reqwest::get(well_known_uri).await.map_err(|_| ())?;
    let config = response.text().await.map_err(|_| ())?;
    Ok(config)
}

/// Extracts all DIDs from the given DID config. If no DID is found or no DID is
/// valid an empty vector is returned.
fn config_to_dids(config: &WellKnownDidConfig) -> Vec<DIDBuf> {
    config
        .linked_dids
        .iter()
        .filter_map(|linked_did| {
            let id = &linked_did.credential_subjects[0].get("id").next();
            if let Some(Value::String(id)) = id {
                DIDBuf::new(id.as_bytes().to_vec()).ok()
            } else {
                None
            }
        })
        .collect::<Vec<_>>()
}

/// Constructs the well-known config URL based on the given URL
/// DIF Well Known DID Configuration specification <https://identity.foundation/.well-known/resources/did-configuration>/
fn url_to_well_known_config_uri(url: &Url) -> Result<Url, ()> {
    let mut url = url.clone();
    url.set_scheme("https").unwrap();
    url.set_path(".well-known/did-configuration.json");
    // remove all unused settings from the URL
    url.set_query(None);
    url.set_fragment(None);
    url.set_port(None).unwrap();
    url.set_password(None).unwrap();
    Ok(url)
}

/// Transforms the given URL to a did:web string. Only the domain and the port
/// of the URL are considered.
/// <https://w3c-ccg.github.io/did-method-web>/
fn url_to_didweb(url: &Url) -> Result<Vec<DIDBuf>, ServiceError> {
    // Extract the domain name
    let domain = match url.domain() {
        Some(domain) => domain,
        _ => {
            return Err(ServiceError::UrlNotSupported(
                "URL has no domain name".to_owned(),
            ))
        }
    };

    let didweb = match url.port() {
        Some(port) => format!("did:web:{domain}%3A{port}"),
        _ => format!("did:web:{domain}"),
    };

    unsafe {
        // SAFETY: we constructed the DID.
        let did = DIDBuf::new_unchecked(didweb.into());

        Ok(vec![did])
    }
}

/// Resolves the DID document from the given DID
async fn resolve_did(did: &DIDBuf) -> Result<DidDocument, ServiceError> {
    // Setup the DID resolver.
    let resolver = AnyDidMethod::default();

    // Resolve the DID document (equal to the example document above).
    match resolver.resolve(did.as_did()).await {
        Ok(output) => Ok(output),
        Err(e) => Err(ServiceError::ResolutionFailure(e)),
    }
}

/// Given a set of services returns all verifiable presentations. Only the "`LinkedVerifiablePresentation`" services are
/// considered.
/// <https://identity.foundation/linked-vp>
async fn fetch_all_linked_presentations(services: &[Service]) -> Vec<JsonPresentation> {
    let linked_vp_type = String::from("LinkedVerifiablePresentation");

    let linked_vp_services = services
        .iter()
        .filter(|s| s.type_.contains(&linked_vp_type)); // pick services with type "LinkedVerifiablePresentation"

    let mut linked_presentations: Vec<JsonPresentation> = Vec::new();
    for svc in linked_vp_services {
        if let Some(vp) = fetch_linked_presentation(svc).await {
            linked_presentations.push(vp);
        }
    }

    linked_presentations
}

/// Iterates over all endpoints of the given service. Each endpoint's body is fetched and the first successful response
/// is returned. `None` is returned if all endpoints fail.
async fn fetch_linked_presentation(service: &Service) -> Option<JsonPresentation> {
    let endpoint_iter = service.service_endpoint.iter().flat_map(|e| e.into_iter());

    for endpoint in endpoint_iter {
        match fetch_endpoint_body(endpoint).await {
            Ok(vp) => match from_str(&vp) {
                Ok(presentation) => return presentation,
                Err(_) => continue,
            },
            Err(()) => continue,
        }
    }

    None
}

/// Downloads the body of the given endpoint
async fn fetch_endpoint_body(endpoint: &Endpoint) -> Result<String, ()> {
    let uri = match endpoint {
        Endpoint::Uri(buf) => buf.to_string(),
        _ => return Err(()),
    };

    let response = reqwest::get(uri).await.map_err(|_| ())?;
    let body = response.text().await.map_err(|_| ())?;

    Ok(body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_url_to_well_known_config_uri() {
        assert_eq!(
            url_to_well_known_config_uri(&Url::parse("https://identity.foundation").unwrap())
                .unwrap()
                .as_str(),
            "https://identity.foundation/.well-known/did-configuration.json"
        );
        assert_eq!(
            url_to_well_known_config_uri(
                &Url::parse("https://identity.foundation/path/is/ignored").unwrap()
            )
            .unwrap()
            .as_str(),
            "https://identity.foundation/.well-known/did-configuration.json"
        );
        assert_eq!(
            url_to_well_known_config_uri(&Url::parse("http://https.is/enforced").unwrap())
                .unwrap()
                .as_str(),
            "https://https.is/.well-known/did-configuration.json"
        );
    }

    #[test]
    fn test_url_to_didweb() {
        assert_eq!(
            url_to_didweb(&Url::parse("https://w3c-ccg.github.io").unwrap()).unwrap()[0],
            "did:web:w3c-ccg.github.io"
        );

        assert_eq!(
            url_to_didweb(&Url::parse("https://w3c-ccg.github.io/path/is/ignored").unwrap())
                .unwrap()[0],
            "did:web:w3c-ccg.github.io"
        );

        url_to_didweb(&Url::parse("https://127.0.0.1").unwrap()).unwrap_err();

        assert_eq!(
            url_to_didweb(&Url::parse("https://example.com:3000").unwrap()).unwrap()[0],
            "did:web:example.com%3A3000"
        );
    }
}
