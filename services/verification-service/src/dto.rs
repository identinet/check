use axum::{
    extract::{rejection::QueryRejection, FromRequestParts, Query},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use ssi::{
    claims::{vc::v1::SpecializedJsonCredential, Invalid, InvalidClaims, InvalidProof},
    dids::Document,
};
use url::Url;

#[non_exhaustive]
pub enum VerificationResponse {
    OK(VerificationResponseDto),
}

impl IntoResponse for VerificationResponse {
    #[inline]
    fn into_response(self) -> Response {
        match self {
            Self::OK(data) => (StatusCode::OK, Json(data)).into_response(),
        }
    }
}

#[non_exhaustive]
pub enum VerificationError {
    BadRequestJson(VerificationErrorResponseDto),
    NotFoundJson(VerificationResponseDto),
    VerificationImpossible(VerificationErrorResponseDto),
}

impl VerificationError {
    #[inline]
    #[must_use]
    pub fn bad_request(message: &str) -> Self {
        let error = VerificationErrorResponseDto {
            error: message.to_owned(),
            verified: false,
        };
        Self::BadRequestJson(error)
    }

    #[inline]
    #[must_use]
    pub const fn bad_request_from(message: String) -> Self {
        let error = VerificationErrorResponseDto {
            error: message,
            verified: false,
        };
        Self::BadRequestJson(error)
    }

    // fn not_found(message: &str) -> Self {
    //     Self::not_found_from(message.to_string())
    // }

    #[inline]
    #[must_use]
    pub fn not_found_from(_message: String) -> Self {
        let empty = VerificationResponseDto {
            documents: Vec::new(),
            credentials: Vec::new(),
            results: Vec::new(),
            verified: false,
        };
        Self::NotFoundJson(empty)
    }

    #[inline]
    #[must_use]
    pub const fn verification_impossible_from(message: String) -> Self {
        let empty = VerificationErrorResponseDto {
            error: message,
            verified: false,
        };
        Self::VerificationImpossible(empty)
    }
}

impl IntoResponse for VerificationError {
    #[inline]
    fn into_response(self) -> Response {
        match self {
            Self::BadRequestJson(data) => (StatusCode::BAD_REQUEST, Json(data)).into_response(),
            Self::NotFoundJson(data) => (StatusCode::NOT_FOUND, Json(data)).into_response(),
            Self::VerificationImpossible(data) => (StatusCode::OK, Json(data)).into_response(),
        }
    }
}

#[derive(Serialize)]
pub struct VerificationResponseDto {
    pub credentials: Vec<SpecializedJsonCredential>,
    pub documents: Vec<Document>,
    pub results: Vec<VerificationResult>,
    pub verified: bool,
}

// TODO deserialize is only required during controller tests - can we conditionally derive?
#[derive(Serialize, Deserialize)]
#[non_exhaustive]
pub struct VerificationErrorResponseDto {
    pub error: String,
    pub verified: bool,
}

// TODO Debug is only required during tests - can we conditionally derive?
#[derive(Deserialize, Debug)]
#[non_exhaustive]
pub struct VerificationRequest {
    pub q: String,
}

impl<S> FromRequestParts<S> for VerificationRequest
where
    S: Send + Sync,
{
    type Rejection = VerificationError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let query = Query::<Self>::from_request_parts(parts, state)
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

#[derive(Serialize, Clone, Debug)]
#[non_exhaustive]
pub struct VerificationResultPayload {
    pub code: u32,
    pub details: String,
    pub message: String,
    pub verified: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "result")]
#[non_exhaustive]
pub enum VerificationResult {
    DidConfigError(VerificationResultPayload),
    VcParseError(VerificationResultPayload),
    VcProofError(VerificationResultPayload),
    VcProofErrorAlgorithmMismatch(VerificationResultPayload),
    VcProofErrorKeyMismatch(VerificationResultPayload),
    VcProofErrorMissing(VerificationResultPayload),
    VcProofErrorSignature(VerificationResultPayload),
    VcValid(VerificationResultPayload),
    VcValidationErrorExpired(VerificationResultPayload),
    VcValidationErrorMissingIssuance(VerificationResultPayload),
    VcValidationErrorOther(VerificationResultPayload),
    VcValidationErrorPremature(VerificationResultPayload),
    VcValidationErrorSubjectMismatch(VerificationResultPayload),
    VpParseError(VerificationResultPayload),
    VpProofError(VerificationResultPayload),
    VpValid(VerificationResultPayload),
    VpVerificationError(VerificationResultPayload),
}

impl VerificationResult {
    #[inline]
    #[must_use]
    pub fn did_config_error(reason: String) -> Self {
        Self::DidConfigError(VerificationResultPayload {
            message: "Verification of DID Configuration failed.".into(),
            details: reason,
            verified: false,
            code: 1 << 16,
        })
    }

    /// Automatic conversion to a Result
    #[inline]
    pub const fn into_result(self) -> Result<Self, Self> {
        match self {
            Self::VcValid(_) | Self::VpValid(_) => Ok(self),
            Self::DidConfigError(_)
            | Self::VcParseError(_)
            | Self::VcProofError(_)
            | Self::VcProofErrorAlgorithmMismatch(_)
            | Self::VcProofErrorKeyMismatch(_)
            | Self::VcProofErrorMissing(_)
            | Self::VcProofErrorSignature(_)
            | Self::VcValidationErrorExpired(_)
            | Self::VcValidationErrorMissingIssuance(_)
            | Self::VcValidationErrorOther(_)
            | Self::VcValidationErrorPremature(_)
            | Self::VcValidationErrorSubjectMismatch(_)
            | Self::VpParseError(_)
            | Self::VpProofError(_)
            | Self::VpVerificationError(_) => Err(self),
        }
    }

    #[inline]
    pub fn into_vec_result(self) -> Result<Vec<Self>, Self> {
        match self {
            Self::VcValid(_) | Self::VpValid(_) => Ok(vec![self]),
            Self::DidConfigError(_)
            | Self::VcParseError(_)
            | Self::VcProofError(_)
            | Self::VcProofErrorAlgorithmMismatch(_)
            | Self::VcProofErrorKeyMismatch(_)
            | Self::VcProofErrorMissing(_)
            | Self::VcProofErrorSignature(_)
            | Self::VcValidationErrorExpired(_)
            | Self::VcValidationErrorMissingIssuance(_)
            | Self::VcValidationErrorOther(_)
            | Self::VcValidationErrorPremature(_)
            | Self::VcValidationErrorSubjectMismatch(_)
            | Self::VpParseError(_)
            | Self::VpProofError(_)
            | Self::VpVerificationError(_) => Err(self),
        }
    }

    #[inline]
    #[must_use]
    pub fn vc_parse_error(e: String) -> Self {
        Self::VcParseError(VerificationResultPayload {
            message: "Failed to parse Verifiable Credential.".into(),
            details: e,
            verified: false,
            code: 1 << 5,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_proof_error(e: String) -> Self {
        Self::VcProofError(VerificationResultPayload {
            message: "Proof error in Verifiable Credential.".into(),
            details: e,
            verified: false,
            code: 1 << 6,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_proof_error_algorithm_mismatch(e: String) -> Self {
        Self::VcProofErrorAlgorithmMismatch(VerificationResultPayload {
            message: "Algorithm mismatch in Verifiable Credential proof.".into(),
            details: e,
            verified: false,
            code: 1 << 10,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_proof_error_key_mismatch(e: String) -> Self {
        Self::VcProofErrorKeyMismatch(VerificationResultPayload {
            message: "Key mismatch in Verifiable Credential proof.".into(),
            details: e,
            verified: false,
            code: 1 << 9,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_proof_error_missing(e: String) -> Self {
        Self::VcProofErrorMissing(VerificationResultPayload {
            message: "Missing proof in Verifiable Credential.".into(),
            details: e,
            verified: false,
            code: 1 << 7,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_proof_error_signature(e: String) -> Self {
        Self::VcProofErrorSignature(VerificationResultPayload {
            message: "Invalid signature in Verifiable Credential proof.".into(),
            details: e,
            verified: false,
            code: 1 << 8,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_valid() -> Self {
        Self::VcValid(VerificationResultPayload {
            message: "Verifiable Credential is valid.".into(),
            details: String::new(),
            verified: true,
            code: 1 << 1,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_validation_error_expired(e: String) -> Self {
        Self::VcValidationErrorExpired(VerificationResultPayload {
            message: "Verifiable Credential has expired.".into(),
            details: e,
            verified: false,
            code: 1 << 13,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_validation_error_other(e: String) -> Self {
        Self::VcValidationErrorOther(VerificationResultPayload {
            message: "Validation failed for unknown reasons.".into(),
            details: e,
            verified: false,
            code: 1 << 11,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_validation_error_premature(e: String) -> Self {
        Self::VcValidationErrorPremature(VerificationResultPayload {
            message: "Verifiable Credential is not valid yet (premature).".into(),
            details: e,
            verified: false,
            code: 1 << 12,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_validation_error_subject_mismatch(e: String) -> Self {
        Self::VcValidationErrorSubjectMismatch(VerificationResultPayload {
            message: "Validation failed due to unexpected subject.".into(),
            details: e,
            verified: false,
            code: 1 << 15,
        })
    }

    #[inline]
    #[must_use]
    pub fn vc_validation_missing_issuance_date(e: String) -> Self {
        Self::VcValidationErrorMissingIssuance(VerificationResultPayload {
            message: "Issuance date is missing in Verifiable Credential.".into(),
            details: e,
            verified: false,
            code: 1 << 14,
        })
    }

    #[inline]
    #[must_use]
    pub fn vp_parse_error(e: String) -> Self {
        Self::VpParseError(VerificationResultPayload {
            message: "Failed to parse Verifiable Presentation.".into(),
            details: e,
            verified: false,
            code: 1 << 2,
        })
    }

    #[inline]
    #[must_use]
    pub fn vp_proof_error(e: String) -> Self {
        Self::VpProofError(VerificationResultPayload {
            message: "Proof error in Verifiable Presentation.".into(),
            details: e,
            verified: false,
            code: 1 << 3,
        })
    }

    #[inline]
    #[must_use]
    pub fn vp_valid() -> Self {
        Self::VpValid(VerificationResultPayload {
            message: "Verifiable Presentation is valid.".into(),
            details: String::new(),
            verified: true,
            code: 1 << 0,
        })
    }

    #[inline]
    #[must_use]
    pub fn vp_verification_error(e: String) -> Self {
        Self::VpVerificationError(VerificationResultPayload {
            message: "Verification of Verifiable Presentation failed.".into(),
            details: e,
            verified: false,
            code: 1 << 4,
        })
    }
}

impl From<Invalid> for VerificationResult {
    #[inline]
    fn from(error: Invalid) -> Self {
        match error {
            Invalid::Claims(claims_error) => match claims_error {
                InvalidClaims::MissingIssuanceDate => {
                    Self::vc_validation_missing_issuance_date(claims_error.to_string())
                }
                InvalidClaims::Premature { valid_from, .. } => {
                    Self::vc_validation_error_premature(valid_from.to_rfc3339())
                }
                InvalidClaims::Expired { valid_until, .. } => {
                    Self::vc_validation_error_expired(valid_until.to_rfc3339())
                }
                InvalidClaims::Other(e) => Self::vc_validation_error_other(e),
            },
            Invalid::Proof(proof_error) => match proof_error {
                InvalidProof::Missing => Self::vc_proof_error_missing(proof_error.to_string()),
                InvalidProof::Signature => Self::vc_proof_error_signature(proof_error.to_string()),
                InvalidProof::KeyMismatch => {
                    Self::vc_proof_error_key_mismatch(proof_error.to_string())
                }
                InvalidProof::AlgorithmMismatch => {
                    Self::vc_proof_error_algorithm_mismatch(proof_error.to_string())
                }
                InvalidProof::Other(_) => Self::vc_proof_error(proof_error.to_string()),
            },
        }
    }
}

#[expect(clippy::single_call_fn, reason = "Function is used in tests")]
fn is_valid_url(url_string: &str) -> bool {
    Url::parse(url_string)
        .map(|url| url.scheme() == "https" || url.scheme() == "did")
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request};
    use core::fmt::Debug;

    #[test]
    fn url_validation() {
        assert!(is_valid_url("https://example.com"));
        assert!(is_valid_url("https://example.com/"));
        assert!(is_valid_url("https://example.com:3000/"));
        assert!(is_valid_url("https://localhost:3000/"));
        assert!(is_valid_url("did:web:example.com"));
        assert!(is_valid_url("did:web:example.com:user1"));
        assert!(is_valid_url("did:web:localhost"));

        assert!(!is_valid_url("ftp://example.com"));
        assert!(!is_valid_url("http://example.com"));
    }

    impl Debug for VerificationError {
        fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
            match self {
                // _ => Ok(()),
                Self::BadRequestJson(arg0) => f.debug_struct(&arg0.error).finish(),
                Self::NotFoundJson(_) => f.debug_struct("VerificationError::NotFound").finish(),
                Self::VerificationImpossible(_) => f
                    .debug_struct("VerificationError::VerificationImpossible")
                    .finish(),
            }
        }
    }

    impl PartialEq for VerificationRequest {
        fn eq(&self, other: &Self) -> bool {
            self.q == other.q
        }
    }

    async fn check_ok(uri: impl AsRef<str>, value: VerificationRequest) {
        let req = Request::builder()
            .uri(uri.as_ref())
            .body(Body::empty())
            .unwrap();

        let (mut parts, _body) = req.into_parts();

        assert_eq!(
            VerificationRequest::from_request_parts(&mut parts, &())
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
            VerificationRequest::from_request_parts(&mut parts, &())
                .await
                .map_err(|err| match err {
                    VerificationError::BadRequestJson(json) => json.error,
                    VerificationError::NotFoundJson(_) => "xyz".to_owned(),
                    VerificationError::VerificationImpossible(_) => "abc".to_owned(),
                })
                .unwrap_err(),
            value
        );
    }

    #[tokio::test]
    async fn test_query() {
        check_ok(
            "http://ver.svc/verify?q=https://www.abc.com",
            VerificationRequest {
                q: "https://www.abc.com".to_owned(),
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
