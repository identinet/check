use axum::{
    extract::{rejection::QueryRejection, FromRequestParts, Query},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use ssi::{claims::vc::v1::SpecializedJsonCredential, dids::Document};
use url::Url;

pub enum VerificationResponse {
    OK(VerificationResponseDto),
}

impl IntoResponse for VerificationResponse {
    fn into_response(self) -> Response {
        match self {
            Self::OK(data) => (StatusCode::OK, Json(data)).into_response(),
        }
    }
}

pub enum VerificationError {
    BadRequestJson(VerificationErrorResponseDto),
    NotFoundJson(VerificationErrorResponseDto),
}

impl VerificationError {
    // fn not_found(message: &str) -> Self {
    //     Self::not_found_from(message.to_string())
    // }
    pub fn not_found_from(message: String) -> Self {
        let error = VerificationErrorResponseDto { error: message };
        VerificationError::NotFoundJson(error)
    }
    pub fn bad_request(message: &str) -> Self {
        let error = VerificationErrorResponseDto {
            error: message.to_string(),
        };
        VerificationError::BadRequestJson(error)
    }
    pub fn bad_request_from(message: String) -> Self {
        let error = VerificationErrorResponseDto { error: message };
        VerificationError::BadRequestJson(error)
    }
}

impl IntoResponse for VerificationError {
    fn into_response(self) -> Response {
        match self {
            Self::BadRequestJson(data) => (StatusCode::BAD_REQUEST, Json(data)).into_response(),

            Self::NotFoundJson(data) => (StatusCode::NOT_FOUND, Json(data)).into_response(),
        }
    }
}

// TODO deserialize is only required during controller tests - can we conditionally derive?
// FIXME update openapi docs
#[derive(Serialize, Deserialize, Debug)]
pub struct VerificationResponseDto {
    pub documents: Vec<Document>,
    pub credentials: Vec<SpecializedJsonCredential>,
    pub results: Vec<String>,
}

// TODO deserialize is only required during controller tests - can we conditionally derive?
#[derive(Serialize, Deserialize)]
pub struct VerificationErrorResponseDto {
    pub error: String,
}

// TODO Debug is only required during tests - can we conditionally derive?
#[derive(Deserialize, Debug)]
pub struct VerificationRequestDto {
    pub url: String,
}

impl<S> FromRequestParts<S> for VerificationRequestDto
where
    S: Send + Sync,
{
    type Rejection = VerificationError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let query = Query::<VerificationRequestDto>::from_request_parts(parts, state)
            .await
            .map_err(|err| match err {
                QueryRejection::FailedToDeserializeQueryString(
                    failed_to_deserialize_query_string,
                ) => {
                    // TODO mute in prod
                    VerificationError::bad_request_from(
                        failed_to_deserialize_query_string.to_string(),
                    )
                }
                _ => VerificationError::bad_request(
                    "Failed to deserialize query string: unknown error",
                ),
            })?;

        if query.url.is_empty() {
            return Err(VerificationError::bad_request("empty 'url' param")); // TODO mute in prod
        }

        if !is_valid_url(&query.url) {
            return Err(VerificationError::bad_request("invalid 'url' param"));
            // TODO mute in prod
        }

        Ok(query.0)
    }
}

fn is_valid_url(url: &str) -> bool {
    Url::parse(url)
        .map(|url| url.scheme() == "https")
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use std::fmt::Debug;

    #[test]
    fn url_validation() {
        assert_eq!(is_valid_url("https://identinet.io"), true);
        assert_eq!(is_valid_url("https://identinet.io/"), true);
        assert_eq!(is_valid_url("https://identinet.io:3000/"), true);
        assert_eq!(is_valid_url("https://localhost:3000/"), true);

        assert_eq!(is_valid_url("ftp://acme.co"), false);
        assert_eq!(is_valid_url("http://acme.co"), false);
    }

    impl Debug for VerificationError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            match self {
                // _ => Ok(()),
                Self::BadRequestJson(arg0) => f.debug_struct(&arg0.error).finish(),
                Self::NotFoundJson(arg0) => f.debug_struct(&arg0.error).finish(),
            }
        }
    }

    impl PartialEq for VerificationRequestDto {
        fn eq(&self, other: &Self) -> bool {
            self.url == other.url
        }
    }

    async fn check_ok(uri: impl AsRef<str>, value: VerificationRequestDto) {
        let req = Request::builder()
            .uri(uri.as_ref())
            .body(Body::empty())
            .unwrap();

        let (mut parts, _body) = req.into_parts();

        assert_eq!(
            VerificationRequestDto::from_request_parts(&mut parts, &())
                .await
                .unwrap(),
            value
        );
    }

    async fn check_err(uri: impl AsRef<str>, value: &str) {
        let req = Request::builder()
            .uri(uri.as_ref())
            .body(Body::empty())
            .unwrap();

        let (mut parts, _body) = req.into_parts();

        assert_eq!(
            VerificationRequestDto::from_request_parts(&mut parts, &())
                .await
                .map_err(|err| match err {
                    VerificationError::BadRequestJson(json) => json.error,
                    VerificationError::NotFoundJson(json) => json.error,
                })
                .unwrap_err(),
            value
        );
    }

    #[tokio::test]
    async fn test_query() {
        check_ok(
            "http://ver.svc/verify?url=https://www.abc.com",
            VerificationRequestDto {
                url: "https://www.abc.com".to_string(),
            },
        )
        .await;

        check_err(
            "http://ver.svc/verify",
            "Failed to deserialize query string: missing field `url`",
        )
        .await;

        check_err("http://ver.svc/verify?url=", "empty 'url' param").await;

        check_err("http://ver.svc/verify?url=abc.com", "invalid 'url' param").await;
    }
}
