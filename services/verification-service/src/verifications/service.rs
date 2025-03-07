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

/// Verifies the given URL
pub async fn verify_by_url(url: Url) -> Result<ssi::dids::resolution::Output, Error> {
    let did = lookup_did(url)?;
    let did_document = resolve_did(did).await?;
    Ok(did_document)
}

/// Performs a DID document lookup based on the DIDs attached to the given URL
fn lookup_did(url: Url) -> Result<DIDBuf, Error> {
    // TODO test if there's a well-known DID config for given url
    // y => get/verify DID config + extract DID
    // n => (fallback) transform URL to DID
    let didweb = url_to_didweb(url)?;
    Ok(didweb)
}

/// Transforms the given URL to a did:web string. Only the domain and the port
/// of the URL are considered.
fn url_to_didweb(url: Url) -> Result<DIDBuf, Error> {
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
    fn test_url_to_didweb() {
        assert_eq!(
            url_to_didweb(Url::parse("https://w3c-ccg.github.io").unwrap()).unwrap(),
            "did:web:w3c-ccg.github.io"
        );

        assert_eq!(
            url_to_didweb(Url::parse("https://w3c-ccg.github.io/path/is/ignored").unwrap())
                .unwrap(),
            "did:web:w3c-ccg.github.io"
        );

        assert!(url_to_didweb(Url::parse("https://127.0.0.1").unwrap()).is_err());

        assert_eq!(
            url_to_didweb(Url::parse("https://example.com:3000").unwrap()).unwrap(),
            "did:web:example.com%3A3000"
        );
    }
}
