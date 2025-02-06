use axum::{
    extract::{rejection::QueryRejection, FromRequestParts, Query},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use fqdn::FQDN;
use serde::{Deserialize, Serialize};

pub enum VerificationResponse {
    OK(VerificationResponseDto),
}

pub enum VerificationError {
    BadRequestJson(VerificationErrorResponseDto),
}

impl IntoResponse for VerificationResponse {
    fn into_response(self) -> Response {
        match self {
            Self::OK(data) => (StatusCode::OK, Json(data)).into_response(),
        }
    }
}

impl VerificationError {
    fn bad_request(message: &str) -> Self {
        let error = VerificationErrorResponseDto {
            error: message.to_string(),
        };
        VerificationError::BadRequestJson(error)
    }
    fn bad_request_from(message: String) -> Self {
        let error = VerificationErrorResponseDto { error: message };
        VerificationError::BadRequestJson(error)
    }
}

impl IntoResponse for VerificationError {
    fn into_response(self) -> Response {
        match self {
            Self::BadRequestJson(data) => (StatusCode::BAD_REQUEST, Json(data)).into_response(),
        }
    }
}

#[derive(Serialize)]
pub struct VerificationResponseDto {
    pub status: String,
}

#[derive(Serialize)]
pub struct VerificationErrorResponseDto {
    pub error: String,
}

#[derive(Deserialize)]
pub struct VerificationRequestDto {
    pub domain: String,
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
                _ => VerificationError::bad_request("failed to parse query params"),
            })?;

        if query.domain.is_empty() {
            return Err(VerificationError::bad_request(
                "missing required 'domain' param",
            )); // TODO mute in prod
        }

        if !is_valid_domain(&query.domain) {
            return Err(VerificationError::bad_request("invalid 'domain' param"));
            // TODO mute in prod
        }

        Ok(query.0)
    }
}

// Helper function to validate domain host
fn is_valid_domain(domain: &str) -> bool {
    domain
        .parse::<FQDN>()
        .map(|p| !p.is_tld()) // Returns true if not TLD, false otherwise
        .unwrap_or(false) // Returns false if parsing fails
}
