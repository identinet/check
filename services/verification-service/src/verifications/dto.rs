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
    NotFoundJson(VerificationResponseDto),
}

impl VerificationError {
    // fn not_found(message: &str) -> Self {
    //     Self::not_found_from(message.to_string())
    // }
    pub fn not_found_from(_message: String) -> Self {
        let empty = VerificationResponseDto {
            documents: Vec::new(),
            credentials: Vec::new(),
            results: Vec::new(),
            verified: false,
        };
        VerificationError::NotFoundJson(empty)
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

#[derive(Serialize)]
pub struct VerificationResponseDto {
    pub documents: Vec<Document>,
    pub credentials: Vec<SpecializedJsonCredential>,
    pub results: Vec<VerificationResult>,
    pub verified: bool,
}

// TODO deserialize is only required during controller tests - can we conditionally derive?
#[derive(Serialize, Deserialize)]
pub struct VerificationErrorResponseDto {
    pub error: String,
}

// TODO Debug is only required during tests - can we conditionally derive?
#[derive(Deserialize, Debug)]
pub struct VerificationRequestDto {
    pub q: String,
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

        if query.q.is_empty() {
            return Err(VerificationError::bad_request("empty 'q' param")); // TODO mute in prod
        }

        if !is_valid_url(&query.q) {
            return Err(VerificationError::bad_request("invalid 'q' param"));
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

#[derive(Serialize, Clone, Debug)]
pub struct VerificationResultPayload {
    message: String,
    details: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "result")]
pub enum VerificationResult {
    VcValid(VerificationResultPayload),
    VpParseError(VerificationResultPayload),
    VpProofError(VerificationResultPayload),
    VpVerificationError(VerificationResultPayload),
    VcParseError(VerificationResultPayload),
    VcProofError(VerificationResultPayload),
    VcProofErrorMissing(VerificationResultPayload),
    VcProofErrorSignature(VerificationResultPayload),
    VcProofErrorKeyMismatch(VerificationResultPayload),
    VcProofErrorAlgorithmMismatch(VerificationResultPayload),
    VcValidationErrorOther(VerificationResultPayload),
    VcValidationErrorPremature(VerificationResultPayload),
    VcValidationErrorExpired(VerificationResultPayload),
    VcValidationErrorMissingIssuance(VerificationResultPayload),
}

impl VerificationResult {
    pub fn vc_valid() -> Self {
        VerificationResult::VcValid(VerificationResultPayload {
            message: "Verifiable Credential is valid.".to_string(),
            details: "".to_string(),
        })
    }

    pub fn vp_parse_error(e: serde_json::Error) -> Self {
        VerificationResult::VpParseError(VerificationResultPayload {
            message: "Failed to parse Verifiable Presentation.".to_string(),
            details: e.to_string(),
        })
    }

    pub fn vp_proof_error(e: ssi::claims::ProofValidationError) -> Self {
        VerificationResult::VpProofError(VerificationResultPayload {
            message: "Proof error in Verifiable Presentation.".to_string(),
            details: e.to_string(),
        })
    }

    pub fn vp_verification_error(e: ssi::claims::Invalid) -> Self {
        VerificationResult::VpVerificationError(VerificationResultPayload {
            message: "Verification of Verifiable Presentation failed.".to_string(),
            details: e.to_string(),
        })
    }

    pub fn vc_parse_error(e: ssi::claims::data_integrity::DecodeError) -> Self {
        VerificationResult::VcParseError(VerificationResultPayload {
            message: "Failed to parse Verifiable Credential.".to_string(),
            details: e.to_string(),
        })
    }

    pub fn vc_proof_error(e: ssi::claims::ProofValidationError) -> Self {
        VerificationResult::VcProofError(VerificationResultPayload {
            message: "Proof error in Verifiable Credential.".to_string(),
            details: e.to_string(),
        })
    }
}

impl From<ssi::claims::Invalid> for VerificationResult {
    fn from(error: ssi::claims::Invalid) -> Self {
        match error {
            ssi::claims::Invalid::Claims(claims_error) => match claims_error {
                ssi::claims::InvalidClaims::MissingIssuanceDate => {
                    VerificationResult::VcValidationErrorMissingIssuance(
                        VerificationResultPayload {
                            message: "Issuance date is missing in Verifiable Credential."
                                .to_string(),
                            details: claims_error.to_string(),
                        },
                    )
                }
                ssi::claims::InvalidClaims::Premature { now: _, valid_from } => {
                    VerificationResult::VcValidationErrorPremature(VerificationResultPayload {
                        message: "Verifiable Credential is not valid yet (premature).".to_string(),
                        details: valid_from.to_rfc3339(),
                    })
                }
                ssi::claims::InvalidClaims::Expired {
                    now: _,
                    valid_until,
                } => VerificationResult::VcValidationErrorExpired(VerificationResultPayload {
                    message: "Verifiable Credential has expired.".to_string(),
                    details: valid_until.to_rfc3339(),
                }),
                ssi::claims::InvalidClaims::Other(e) => {
                    VerificationResult::VcValidationErrorOther(VerificationResultPayload {
                        message: "Validation failed for unknown reasons.".to_string(),
                        details: e,
                    })
                }
            },
            ssi::claims::Invalid::Proof(proof_error) => match proof_error {
                ssi::claims::InvalidProof::Missing => {
                    VerificationResult::VcProofErrorMissing(VerificationResultPayload {
                        message: "Missing proof in Verifiable Credential.".to_string(),
                        details: proof_error.to_string(),
                    })
                }

                ssi::claims::InvalidProof::Signature => {
                    VerificationResult::VcProofErrorSignature(VerificationResultPayload {
                        message: "Invalid signature in Verifiable Credential proof.".to_string(),
                        details: proof_error.to_string(),
                    })
                }
                ssi::claims::InvalidProof::KeyMismatch => {
                    VerificationResult::VcProofErrorKeyMismatch(VerificationResultPayload {
                        message: "Key mismatch in Verifiable Credential proof.".to_string(),
                        details: proof_error.to_string(),
                    })
                }
                ssi::claims::InvalidProof::AlgorithmMismatch => {
                    VerificationResult::VcProofErrorAlgorithmMismatch(VerificationResultPayload {
                        message: "Algorithm mismatch in Verifiable Credential proof.".to_string(),
                        details: proof_error.to_string(),
                    })
                }
                ssi::claims::InvalidProof::Other(_) => {
                    VerificationResult::VcProofError(VerificationResultPayload {
                        message: "Proof error in Verifiable Credential.".to_string(),
                        details: proof_error.to_string(),
                    })
                }
            },
        }
    }
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
                Self::NotFoundJson(_) => f.debug_struct("VerificationError::NotFound").finish(),
            }
        }
    }

    impl PartialEq for VerificationRequestDto {
        fn eq(&self, other: &Self) -> bool {
            self.q == other.q
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
                    VerificationError::NotFoundJson(_) => "xyz".to_string(),
                })
                .unwrap_err(),
            value
        );
    }

    #[tokio::test]
    async fn test_query() {
        check_ok(
            "http://ver.svc/verify?q=https://www.abc.com",
            VerificationRequestDto {
                q: "https://www.abc.com".to_string(),
            },
        )
        .await;

        check_err(
            "http://ver.svc/verify",
            "Failed to deserialize query string: missing field `q`",
        )
        .await;

        check_err("http://ver.svc/verify?q=", "empty 'q' param").await;

        check_err("http://ver.svc/verify?q=abc.com", "invalid 'q' param").await;
    }
}
