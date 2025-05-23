extern crate ssi;

use url::Url;

use super::{
    dto::{VerificationError, VerificationRequestDto, VerificationResponse},
    service::{self, Error},
};

pub async fn verify_domain(
    params: VerificationRequestDto,
) -> Result<VerificationResponse, VerificationError> {
    // save to unwrap, URL has been parsed during DTO validation already
    let url = Url::parse(&params.q).unwrap();

    let dto = service::verify_by_url(&url)
        .await
        .map_err(|err| match err {
            Error::UrlNotSupported(s) => VerificationError::bad_request_from(s),
            Error::ResolutionError(error) => match error {
                ssi::dids::resolution::Error::NotFound => {
                    VerificationError::not_found_from(error.to_string())
                }
                _ => VerificationError::bad_request_from(error.to_string()),
            },
            _ => VerificationError::bad_request_from("Should not happen".to_string()),
        })?;

    Ok(VerificationResponse::OK(dto))
}

#[cfg(test)]
mod tests {
    // use crate::verifications::dto::VerificationErrorResponseDto;

    // use super::*;
    // use axum::{http::StatusCode, routing::get, test_helpers::TestClient, Extension, Router};

    // FIXME: disable test that performs a network request. Such a test is not permissible in the nix build environment
    // #[tokio::test]
    // async fn test_verify_domain() {
    //     #[derive(Clone)]
    //     struct Ext;
    //
    //     let client = TestClient::new(
    //         Router::new()
    //             .route("/", get(verify_domain))
    //             .layer(Extension(Ext)),
    //     );
    //
    //     let res = client.get("/?url=https://identity.foundation").await;
    //     assert_eq!(res.status(), StatusCode::OK);
    //     let data = res.json::<VerificationResponseDto>().await;
    //     assert_eq!(data.status, "OK");
    //
    //     let res = client.get("/?url=").await;
    //     assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    //     let data = res.json::<VerificationErrorResponseDto>().await;
    //     assert_eq!(data.error, "empty 'url' param");
    // }
}
