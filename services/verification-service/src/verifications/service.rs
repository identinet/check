use reqwest;
use serde::Deserialize;
use ssi::dids::{AnyDidMethod, DIDBuf, DIDResolver};
use url::Url;

/// Verification error.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// URL is not supported
    #[error("URL not supported: {0}")]
    UrlNotSupported(String),

    /// Unable to resolve DID document
    #[error("DID could not be resolved")]
    ResolutionError(#[from] ssi::dids::resolution::Error),
}

#[derive(Debug, Deserialize)]
struct DidConfigSubject {
    id: String,
}
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LinkedDid {
    credential_subject: DidConfigSubject,
}
#[derive(Debug, Deserialize)]
struct DidConfig {
    linked_dids: Vec<LinkedDid>,
}

/// Verifies the given URL
pub async fn verify_by_url(url: &Url) -> Result<ssi::dids::resolution::Output, Error> {
    let did = lookup_did(url).await?;
    let did_document = resolve_did(did).await?;
    Ok(did_document)
}

/// Performs a DID document lookup based on the DIDs attached to the given URL
/// We check if there is a DID well-known config at the given URL to lookup the
/// DID. If this fails we fall back to did:web representation of the given URL.
async fn lookup_did(url: &Url) -> Result<DIDBuf, Error> {
    // test if there's a well-known DID config for given url
    let config = match lookup_did_config(url).await {
        Ok(config) => config,
        // lookup failed, fall back to did web
        Err(_) => return url_to_didweb(url),
    };

    // extract did from config
    match config_to_did(&config) {
        Ok(did) => Ok(did),
        // extraction failed, fall back to did web
        Err(_) => return url_to_didweb(url),
    }
}

/// Downloads the DID well-known config from the given URL
/// https://identity.foundation/specs/did-configuration/
async fn lookup_did_config(url: &Url) -> Result<DidConfig, reqwest::Error> {
    let well_known_uri = url_to_well_known_config_uri(&url);
    // TODO handle JWT proof format
    // TODO handle JSON parse errors
    let config = reqwest::get(well_known_uri)
        .await?
        .json::<DidConfig>()
        .await?;
    Ok(config)
}

/// Extracts the DID from the given DID config
fn config_to_did(config: &DidConfig) -> Result<DIDBuf, ssi::dids::InvalidDID<Vec<u8>>> {
    // TODO what if none/multiple DIDs are configured?
    let did = config.linked_dids[0].credential_subject.id.clone();
    DIDBuf::new(did.into_bytes())
}

/// Constructs the well-known config URL based on the given URL
/// https://identity.foundation/specs/did-configuration/
fn url_to_well_known_config_uri(url: &Url) -> String {
    // url.authority() returns origin as string and strips default ports
    format!(
        "https://{}/.well-known/did-configuration.json",
        url.authority()
    )
}

/// Transforms the given URL to a did:web string. Only the domain and the port
/// of the URL are considered.
/// https://w3c-ccg.github.io/did-method-web/
fn url_to_didweb(url: &Url) -> Result<DIDBuf, Error> {
    // Extract the domain name
    let domain = match url.domain() {
        Some(domain) => domain,
        _ => return Err(Error::UrlNotSupported("URL has no domain name".to_owned())),
    };

    let didweb = match url.port() {
        Some(port) => format!("did:web:{}%3A{}", domain, port),
        _ => format!("did:web:{}", domain),
    };

    unsafe {
        // SAFETY: we constructed the DID.
        let did = DIDBuf::new_unchecked(didweb.into());

        Ok(did)
    }
}

/// Resolves the DID document from the given DID
async fn resolve_did(did: DIDBuf) -> Result<ssi::dids::resolution::Output, Error> {
    // Setup the DID resolver.
    let resolver = AnyDidMethod::default();

    // Resolve the DID document (equal to the example document above).
    match resolver.resolve(did.as_did()).await {
        Ok(output) => Ok(output),
        Err(e) => Err(Error::ResolutionError(e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_url_to_well_known_config_uri() {
        assert_eq!(
            url_to_well_known_config_uri(&Url::parse("https://identity.foundation").unwrap()),
            "https://identity.foundation/.well-known/did-configuration.json"
        );
        assert_eq!(
            url_to_well_known_config_uri(
                &Url::parse("https://identity.foundation/path/is/ignored").unwrap()
            ),
            "https://identity.foundation/.well-known/did-configuration.json"
        );
    }

    #[test]
    fn test_url_to_didweb() {
        assert_eq!(
            url_to_didweb(&Url::parse("https://w3c-ccg.github.io").unwrap()).unwrap(),
            "did:web:w3c-ccg.github.io"
        );

        assert_eq!(
            url_to_didweb(&Url::parse("https://w3c-ccg.github.io/path/is/ignored").unwrap())
                .unwrap(),
            "did:web:w3c-ccg.github.io"
        );

        assert!(url_to_didweb(&Url::parse("https://127.0.0.1").unwrap()).is_err());

        assert_eq!(
            url_to_didweb(&Url::parse("https://example.com:3000").unwrap()).unwrap(),
            "did:web:example.com%3A3000"
        );
    }
}
