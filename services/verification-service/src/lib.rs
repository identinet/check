#![allow(
    clippy::implicit_return,
    clippy::cfg_not_test,
    clippy::question_mark_used,
    clippy::min_ident_chars,
    clippy::multiple_crate_versions,
    reason = "Simplification of code"
)]

pub mod dto;
use dto::VerificationResult;
use serde::Deserialize;
use ssi::claims::vc::v1::JsonCredential;
#[cfg(not(test))]
use ssi::dids::AnyDidMethod;
#[cfg(test)]
use ssi::dids::{self, StaticDIDResolver};
#[cfg(test)]
use ssi::prelude::DIDResolver as _;
use ssi::{
    claims::{
        chrono::Utc,
        data_integrity::AnyDataIntegrity,
        vc::v1::{data_integrity::any_credential_from_json_str, JsonPresentation},
        VerificationParameters,
    },
    dids::{DIDBuf, VerificationMethodDIDResolver},
    json_ld::syntax::Value,
    verification_methods::AnyMethod,
};
use tokio::task::JoinSet;
use url::Url;

// Well Known DID Configuration Specification https://identity.foundation/.well-known/resources/did-configuration/
#[derive(Debug, Deserialize)]
#[non_exhaustive]
pub struct WellKnownDidConfig {
    // TODO: add support for Jwt credentials
    pub linked_dids: Vec<JsonCredential>,
}

/// Creates a verifier for VCs and VPs that uses a static DID resolver which knows about the
/// DIDs used in the credentials available in the tests/ directory.
#[cfg(test)]
fn static_test_resovler() -> VerificationMethodDIDResolver<StaticDIDResolver, AnyMethod> {
    let did_holder = include_str!("../tests/dids/did-holder")
        .trim()
        .parse()
        .unwrap();
    let did_doc_holder = dids::resolution::Output::from_content(
        include_bytes!("../tests/dids/did-doc-holder.json").to_vec(),
        Some("application/did+json".to_owned()),
    );
    let did_tp = include_str!("../tests/dids/did-trust-party")
        .trim()
        .parse()
        .unwrap();
    let did_doc_tp = dids::resolution::Output::from_content(
        include_bytes!("../tests/dids/did-doc-trust-party.json").to_vec(),
        Some("application/did+json".to_owned()),
    );
    // Create a static DID resolver that resolves our test DID into a
    // static DID document
    let mut did_resolver = StaticDIDResolver::new();
    did_resolver.insert(did_holder, did_doc_holder);
    did_resolver.insert(did_tp, did_doc_tp);
    // Turn the DID resolver into a verification method resolver by setting
    // resolution options
    did_resolver.into_vm_resolver()
}

/// Verifies the given DID configuration.
///
/// First, the embedded `DomainLinkage` VC is verified. Then, the verification steps mentioned at
/// <https://identity.foundation/.well-known/resources/did-configuration/#did-configuration-resource-verification> are
/// executed:
///
/// 1. credentialSubject.id MUST be a DID
/// 2. credentialSubject.id MUST be equal to the issuer
/// 3. credentialSubject.origin property MUST be present, and its value MUST match the origin the resource was requested from.
#[inline]
pub async fn verify_did_configuration_vc(
    did_configuration_json: &String,
    url: &Url,
) -> Result<VerificationResult, VerificationResult> {
    // TODO: add support for JWT credentials
    // TODO: what if multiple credentials are available, is this handled properly?
    match serde_json::from_slice::<WellKnownDidConfig>(did_configuration_json.as_bytes()) {
        Ok(config) => {
            let domain_linkage_vc_json = serde_json::to_string(&config.linked_dids[0])
                .map_err(|error| VerificationResult::did_config_error(error.to_string()))?;
            let issuer = config.linked_dids[0].issuer.id().as_bytes().to_vec();
            let issuer_did = DIDBuf::new(issuer)
                .map_err(|_e| VerificationResult::did_config_error("issuer is not a DID".into()))?;
            match verify_vc(&domain_linkage_vc_json, &issuer_did, false).await {
                Ok(_) => {
                    // The credentialSubject.origin property MUST be present,
                    // and its value MUST match the origin the resource was requested from.
                    config.linked_dids[0].credential_subjects[0]
                        .get("origin")
                        .next()
                        .and_then(|value| match value {
                            Value::String(origin) => {
                                (*origin == url.origin().ascii_serialization()).then_some(origin)
                            }
                            Value::Null | Value::Boolean(_) | Value::Number(_) | Value::Array(_) | Value::Object(_) => None,
                        })
                        .ok_or_else(|| VerificationResult::did_config_error(
                            "credentialSubject.origin must match the origin the resource was requested from"
                                .into(),
                        ))?;
                    VerificationResult::vc_valid().into_result()
                }
                Err(error) => match error {
                    VerificationResult::VcValidationErrorOther(payload) => {
                        VerificationResult::did_config_error(payload.details).into_result()
                    }
                    VerificationResult::VcValidationErrorSubjectMismatch(_) => {
                        VerificationResult::did_config_error(
                            "Subject must be equal to issuer".into(),
                        )
                        .into_result()
                    }
                    VerificationResult::VpValid(_)
                    | VerificationResult::VcValid(_)
                    | VerificationResult::VpParseError(_)
                    | VerificationResult::VpProofError(_)
                    | VerificationResult::VpVerificationError(_)
                    | VerificationResult::VcParseError(_)
                    | VerificationResult::VcProofError(_)
                    | VerificationResult::VcProofErrorMissing(_)
                    | VerificationResult::VcProofErrorSignature(_)
                    | VerificationResult::VcProofErrorKeyMismatch(_)
                    | VerificationResult::VcProofErrorAlgorithmMismatch(_)
                    | VerificationResult::VcValidationErrorPremature(_)
                    | VerificationResult::VcValidationErrorExpired(_)
                    | VerificationResult::VcValidationErrorMissingIssuance(_)
                    | VerificationResult::DidConfigError(_) => error.into_result(),
                },
            }
        }
        Err(error) => VerificationResult::did_config_error(error.to_string()).into_result(),
    }
}

/// Verifies the given VC and validates the contained claims.
///
/// I.e. checks the cryptographic proof and verifies that the claims themselves
/// are consistent and valid (e.g. expiration date has not passed, yet).
/// Bearer credentials with credentialSubject.id are considered valid when `allow_missing_subjectid` is true.
#[inline]
pub async fn verify_vc(
    vc_json: &str,
    expected_subject: &DIDBuf,
    allow_missing_subjectid: bool,
) -> Result<VerificationResult, VerificationResult> {
    let vc = match any_credential_from_json_str(vc_json) {
        Ok(c) => c,
        Err(e) => return VerificationResult::vc_parse_error(e.to_string()).into_result(),
    };

    // Prepare our verifier
    // TODO can we avoid doing this with every verify_vc invocation?
    let verifier = create_verifier();
    match vc.verify(&verifier).await {
        Ok(Ok(())) => {
            // The credentialSubject.id MUST be a DID,
            let id = &vc.credential_subjects[0]
                .get("id")
                .next()
                .and_then(|v| match v {
                    Value::String(value) => DIDBuf::new(value.as_bytes().to_vec()).ok(),
                    Value::Null
                    | Value::Boolean(_)
                    | Value::Number(_)
                    | Value::Array(_)
                    | Value::Object(_) => None,
                });
            if allow_missing_subjectid && id.is_none() {
                VerificationResult::vc_valid().into_result()
            } else {
                let did = id.clone().ok_or_else(|| {
                    VerificationResult::vc_validation_error_other("Subject must be a DID".into())
                })?;

                // and the value MUST be equal to the Issuer of the Domain Linkage Credential.
                if did == *expected_subject {
                    VerificationResult::vc_valid().into_result()
                } else {
                    VerificationResult::vc_validation_error_subject_mismatch(format!(
                        "Expected '{}' but found '{}'",
                        expected_subject.as_uri(),
                        did.as_uri()
                    ))
                    .into_result()
                }
            }
        }
        Ok(Err(error)) => VerificationResult::from(error).into_result(),
        Err(error) => VerificationResult::vc_proof_error(error.to_string()).into_result(),
    }
}

/// Verifies the given Verifiable Presentations.
///
/// After verifying the proof of each presentation the nested Verifiable
/// Credentials are verified, too. The VC verification process also includes validation - i.e. proofs are checked and
/// claims like `expirationDate` are tested for consitency.
///
/// Returns a list of verification results. One result per VC. If there is an error during VP verification the result is
/// expanded to match the number of VCs. E.g. if you have a VP with two VCs and the proof of the VP can't be verified
/// successfully you'll receive `[VpProofError,VpProofError]`.
#[inline]
pub async fn verify_presentations(
    presentations: Vec<JsonPresentation>,
    did: &DIDBuf,
) -> Vec<VerificationResult> {
    // Prepare verification tasks for each presentation
    let tasks: JoinSet<_> = presentations
        .into_iter()
        .map(|vp| {
            let did_clone = did.clone();
            async move {
                // TODO find more performant way to transfrom JsonPresentation to AnyDataIntegrity
                // without serialization roundtrips
                //
                // it should be safe to unwrap the result as we just deserialized the whole VP
                // => serializing the VP should work without errors
                match serde_json::to_string(&vp) {
                    Ok(vp_json) => match verify_vp(&vp_json, &did_clone, true).await {
                        Ok(results) => results,
                        // On error, something was wrong with the VP. We expand that error for each VC.
                        Err(vp_error) => vp
                            .verifiable_credentials
                            .iter()
                            .map(|_| vp_error.clone())
                            .collect(),
                    },
                    Err(e) => vec![VerificationResult::vp_parse_error(e.to_string())],
                }
            }
        })
        .collect();
    let results = tasks.join_all().await.into_iter().flatten().collect();
    results
}

/// Verifies the given Verifiable Presentation and all included Verifiable
/// Credentials.
#[inline]
pub async fn verify_vp(
    vp_json: &str,
    expected_holder: &DIDBuf,
    verify_vcs: bool,
) -> Result<Vec<VerificationResult>, VerificationResult> {
    // Create DataIntegrity from JSON string
    let vp: AnyDataIntegrity<JsonPresentation> = match serde_json::from_str(vp_json) {
        Ok(p) => p,
        Err(e) => return VerificationResult::vp_parse_error(e.to_string()).into_vec_result(),
    };
    // Verify the presentation's proof
    let verifier = create_verifier();
    match vp.verify(&verifier).await {
        Err(proof_err) => {
            return VerificationResult::vp_proof_error(proof_err.to_string()).into_vec_result()
        }
        Ok(Err(verification_err)) => {
            return VerificationResult::vp_verification_error(verification_err.to_string())
                .into_vec_result()
        }
        Ok(Ok(())) => {
            // go on
        }
    }
    vp.holder
        .as_ref()
        .and_then(|holder| (*holder.as_uri() == expected_holder.as_uri()).then_some(holder))
        .ok_or_else(|| {
            VerificationResult::vp_verification_error(
                "Holder of presentation must match DID".to_owned(),
            )
        })?;
    if verify_vcs {
        let tasks: JoinSet<_> = vp
            .claims
            .verifiable_credentials
            .into_iter()
            .enumerate()
            .map(|(i, vc)| {
                let holder_clone = expected_holder.clone();
                async move {
                    // TODO find more performant way to transfrom SpecializedJsonCredential to AnyDataIntegrity
                    // without serialization roundtrips
                    //
                    // it should be safe to unwrap the result as we just deserialized the whole VP
                    // => serializing the VC should work without errors
                    match serde_json::to_string(&vc) {
                        Ok(vc_json_data) => {
                            match verify_vc(&vc_json_data, &holder_clone, true).await {
                                Err(r) | Ok(r) => (i, r),
                            }
                        }
                        Err(r) => (i, VerificationResult::vc_parse_error(r.to_string())),
                    }
                }
            })
            .collect();
        let mut task_results = tasks.join_all().await;
        task_results.sort_by_key(|item| item.0);
        let sorted_results: Vec<VerificationResult> =
            task_results.into_iter().map(|(_, vc)| vc).collect();
        return Ok(sorted_results);
    }
    VerificationResult::vp_valid().into_vec_result()
}

cfg_if::cfg_if! {
     if #[cfg(test)] {
        /// Creates a verifier for VCs and VPs that uses AnyDidMethod to resolve DIDs.
        /// The verifier will use the current date/time when validating dates.
        fn create_verifier(
        ) -> VerificationParameters<VerificationMethodDIDResolver<StaticDIDResolver, AnyMethod>> {
            let resolver = static_test_resovler();
            // Create a verifier using the verification method resolver
            let verifier = VerificationParameters::from_resolver(resolver);
            verifier.with_date_time(Utc::now())
        }
    } else {
        /// Creates a verifier for VCs and VPs that uses AnyDidMethod to resolve DIDs.
        /// The verifier will use the current date/time when validating dates.
        fn create_verifier(
        ) -> VerificationParameters<VerificationMethodDIDResolver<AnyDidMethod, AnyMethod>> {
            let resolver =
                VerificationMethodDIDResolver::<_, AnyMethod>::new(AnyDidMethod::default());
            // Create a verifier using the verification method resolver
            let verifier = VerificationParameters::from_resolver(resolver);
            verifier.with_date_time(Utc::now())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn holder_did() -> DIDBuf {
        include_str!("../tests/dids/did-holder")
            .trim()
            .parse()
            .unwrap()
    }

    #[tokio::test]
    async fn verify_vc_self_issued() {
        let vc_json = fs::read_to_string("tests/credentials/credential-self-issued.json").unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &holder_did(), false).await.unwrap(),
            VerificationResult::VcValid(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_self_issued_bad_subject() {
        let vc_json = fs::read_to_string("tests/credentials/credential-self-issued.json").unwrap();
        let did = DIDBuf::new(b"did:example:foo".to_vec()).unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &did, false).await.unwrap_err(),
            VerificationResult::VcValidationErrorSubjectMismatch(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_self_issued_no_subjectid_disallowed() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-self-issued-no-id.json").unwrap();
        let did = DIDBuf::new(b"did:example:foo".to_vec()).unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &did, false).await.unwrap_err(),
            VerificationResult::VcValidationErrorOther(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_self_issued_no_subjectid_allowed() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-self-issued-no-id.json").unwrap();
        let did = DIDBuf::new(b"did:example:foo".to_vec()).unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &did, true).await.unwrap(),
            VerificationResult::VcValid(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_self_issued_tampered() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-self-issued-tampered.json").unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &holder_did(), false).await.unwrap_err(),
            VerificationResult::VcProofErrorSignature(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_tp_issued_no_expiration() {
        let vc_json = fs::read_to_string(
            "tests/credentials/credential-trust-party-issued-no-expiration-date.json",
        )
        .unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &holder_did(), false).await.unwrap(),
            VerificationResult::VcValid(_)
        ));

        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-not-expired.json")
                .unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &holder_did(), false).await.unwrap(),
            VerificationResult::VcValid(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_tp_issued_expired() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-expired.json")
                .unwrap();
        assert!(matches!(
            verify_vc(&vc_json, &holder_did(), false).await.unwrap_err(),
            VerificationResult::VcValidationErrorExpired(_)
        ));
    }

    #[tokio::test]
    async fn verify_vp_single_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-single-vc.json").unwrap();
        let x = verify_vp(&vp_json, &holder_did(), true).await.unwrap();
        assert_eq!(x.len(), 1);
        assert!(matches!(x[0], VerificationResult::VcValid(_)));
    }

    #[tokio::test]
    async fn verify_vp_multiple_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-multiple-vc.json").unwrap();
        let x = verify_vp(&vp_json, &holder_did(), true).await.unwrap();
        assert_eq!(x.len(), 3);
        assert!(matches!(x[0], VerificationResult::VcValid(_)));
        assert!(matches!(x[1], VerificationResult::VcValid(_)));
        assert!(matches!(x[2], VerificationResult::VcValid(_)));
    }

    #[tokio::test]
    async fn verify_vp_multiple_vc_expired() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-multiple-vc-expired.json")
                .unwrap();
        let x = verify_vp(&vp_json, &holder_did(), true).await.unwrap();
        assert_eq!(x.len(), 2);
        assert!(matches!(x[0], VerificationResult::VcValid(_)));
        assert!(matches!(
            x[1],
            VerificationResult::VcValidationErrorExpired(_)
        ));
    }

    #[tokio::test]
    async fn verify_vp_tampered_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-tampered-vc.json").unwrap();
        let x = verify_vp(&vp_json, &holder_did(), true).await.unwrap();
        assert_eq!(x.len(), 1);
        assert!(matches!(x[0], VerificationResult::VcProofErrorSignature(_)));
    }

    #[tokio::test]
    async fn verify_vp_bad_holder() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-tampered-vc.json").unwrap();
        let did = DIDBuf::new(b"did:example:foo".to_vec()).unwrap();
        let x = verify_vp(&vp_json, &did, true).await.unwrap_err();
        assert!(matches!(x, VerificationResult::VpVerificationError(_)));
    }

    #[tokio::test]
    async fn verify_did_config() {
        let did_config_json =
            fs::read_to_string("tests/did-configurations/did-config-holder.json").unwrap();

        let url = Url::parse("https://example.com").unwrap();
        let x = verify_did_configuration_vc(&did_config_json, &url)
            .await
            .unwrap();
        assert!(matches!(x, VerificationResult::VcValid(_)));
    }

    #[tokio::test]
    async fn verify_did_config_id_not_a_did() {
        let did_config_json =
            fs::read_to_string("tests/did-configurations/did-config-holder-bad-subject-id.json")
                .unwrap();

        let url = Url::parse("https://example.com").unwrap();
        let x = verify_did_configuration_vc(&did_config_json, &url)
            .await
            .unwrap_err();
        assert!(matches!(x, VerificationResult::DidConfigError(_)));

        match x {
            VerificationResult::DidConfigError(p) => {
                assert_eq!(p.details, "Subject must be a DID");
            }
            _ => panic!("unexpected"),
        }
    }

    #[tokio::test]
    async fn verify_did_config_id_not_issuer() {
        let did_config_json = fs::read_to_string(
            "tests/did-configurations/did-config-holder-subject-is-not-issuer.json",
        )
        .unwrap();

        let url = Url::parse("https://example.com").unwrap();
        let x = verify_did_configuration_vc(&did_config_json, &url)
            .await
            .unwrap_err();
        assert!(matches!(x, VerificationResult::DidConfigError(_)));

        match x {
            VerificationResult::DidConfigError(p) => {
                assert_eq!(p.details, "Subject must be equal to issuer");
            }
            _ => panic!("unexpected"),
        }
    }

    #[tokio::test]
    async fn verify_did_config_origin_not_url() {
        let did_config_json =
            fs::read_to_string("tests/did-configurations/did-config-holder-fake-origin.json")
                .unwrap();

        let url = Url::parse("https://example.com").unwrap();
        let x = verify_did_configuration_vc(&did_config_json, &url)
            .await
            .unwrap_err();
        assert!(matches!(x, VerificationResult::DidConfigError(_)));

        match x {
            VerificationResult::DidConfigError(p) => {
                assert_eq!(p.details, "credentialSubject.origin must match the origin the resource was requested from");
            }
            _ => panic!("unexpected"),
        }
    }
}
