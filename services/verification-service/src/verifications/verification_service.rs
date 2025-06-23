use super::dto::VerificationResult;
use ssi::{
    claims::{
        chrono::Utc,
        data_integrity::AnyDataIntegrity,
        vc::v1::{data_integrity::any_credential_from_json_str, JsonPresentation},
        VerificationParameters,
    },
    dids::VerificationMethodDIDResolver,
    verification_methods::AnyMethod,
};
use tokio::task::JoinSet;

/// Verifies the given Verifiable Presentations. After verifying the proof of each presentation the nested Verifiable
/// Credentials are verified, too. The VC verification process also includes validation - i.e. proofs are checked and
/// claims like `expirationDate` are tested for consitency.
///
/// Returns a list of verification results. One result per VC. If there is an error during VP verification the result is
/// expanded to match the number of VCs. E.g. if you have a VP with two VCs and the proof of the VP can't be verified
/// successfully you'll receive `[VpProofError,VpProofError]`.
pub async fn verify_presentations(presentations: Vec<JsonPresentation>) -> Vec<VerificationResult> {
    // Prepare verification tasks for each presentation
    let tasks: JoinSet<_> = presentations
        .into_iter()
        .map(|vp| async move {
            // TODO find more performant way to transfrom JsonPresentation to AnyDataIntegrity
            // without serialization roundtrips
            //
            // it should be safe to unwrap the result as we just deserialized the whole VP
            // => serializing the VP should work without errors
            let vp_json = serde_json::to_string(&vp).unwrap();
            match verify_vp(&vp_json).await {
                Ok(results) => results,
                // On error, something was wrong with the VP. We expand that error for each VC.
                Err(vp_error) => vp
                    .verifiable_credentials
                    .iter()
                    .map(|_| vp_error.clone())
                    .collect(),
            }
        })
        .collect();

    let results = tasks.join_all().await.into_iter().flatten().collect();
    results
}

/// Verifies the given Verifiable Presentation and all included Verifiable
/// Credentials.
async fn verify_vp(vp_json: &String) -> Result<Vec<VerificationResult>, VerificationResult> {
    // Create DataIntegrity from JSON string
    let vp: AnyDataIntegrity<JsonPresentation> = match serde_json::from_str(&vp_json) {
        Ok(p) => p,
        Err(e) => return Err(VerificationResult::vp_parse_error(e)),
    };

    // Verify the presentation's proof
    let verifier = create_verifier();
    match vp.verify(&verifier).await {
        Err(proof_err) => return Err(VerificationResult::vp_proof_error(proof_err)),
        Ok(Err(verification_err)) => {
            return Err(VerificationResult::vp_verification_error(verification_err))
        }
        Ok(Ok(())) => {
            // go on
        }
    }

    let tasks: JoinSet<_> = vp
        .claims
        .verifiable_credentials
        .into_iter()
        .map(|vc| async move {
            // TODO find more performant way to transfrom SpecializedJsonCredential to AnyDataIntegrity
            // without serialization roundtrips
            //
            // it should be safe to unwrap the result as we just deserialized the whole VP
            // => serializing the VC should work without errors
            let vc_json = serde_json::to_string(&vc).unwrap();
            match verify_vc(&vc_json).await {
                Ok(r) => r,
                Err(r) => r,
            }
        })
        .collect();

    let results = tasks.join_all().await;
    Ok(results)
}

/// Verifies the given VC and validates the contained claims.
/// I.e. checks the cryptographic proof and verifies that the claims themselves
/// are consistent and valid (e.g. expiration date has not passed, yet).
pub async fn verify_vc(vc_json: &String) -> Result<VerificationResult, VerificationResult> {
    let vc = match any_credential_from_json_str(&vc_json) {
        Ok(c) => c,
        Err(e) => return Err(VerificationResult::vc_parse_error(e)),
    };

    // Prepare our verifier
    // TODO can we avoid doing this with every verify_vc invocation?
    let verifier = create_verifier();
    match vc.verify(&verifier).await {
        Ok(Ok(())) => Ok(VerificationResult::vc_valid()),
        Ok(Err(e)) => Err(VerificationResult::from(e)),
        Err(e) => Err(VerificationResult::vc_proof_error(e)),
    }
}

/// Creates a verifier for VCs and VPs that uses AnyDidMethod to resolve DIDs.
/// The verifier will use the current date/time when validating dates.
#[cfg(not(test))]
fn create_verifier(
) -> VerificationParameters<VerificationMethodDIDResolver<ssi::dids::AnyDidMethod, AnyMethod>> {
    let resolver =
        VerificationMethodDIDResolver::<_, AnyMethod>::new(ssi::dids::AnyDidMethod::default());

    // Create a verifier using the verification method resolver
    let v = VerificationParameters::from_resolver(resolver);
    v.with_date_time(Utc::now())
}

#[cfg(test)]
use ssi::prelude::DIDResolver;
/// Creates a verifier for VCs and VPs that uses a static DID resolver which knows about the
/// DIDs used in the credentials available in the tests/ directory.
#[cfg(test)]
fn create_verifier(
) -> VerificationParameters<VerificationMethodDIDResolver<ssi::dids::StaticDIDResolver, AnyMethod>>
{
    let did_holder = include_str!("../../tests/dids/did-holder")
        .trim()
        .parse()
        .unwrap();
    let did_doc_holder = ssi::dids::resolution::Output::from_content(
        include_bytes!("../../tests/dids/did-doc-holder.json").to_vec(),
        Some("application/did+json".to_owned()),
    );

    let did_tp = include_str!("../../tests/dids/did-trust-party")
        .trim()
        .parse()
        .unwrap();
    let did_doc_tp = ssi::dids::resolution::Output::from_content(
        include_bytes!("../../tests/dids/did-doc-trust-party.json").to_vec(),
        Some("application/did+json".to_owned()),
    );

    // Create a static DID resolver that resolves our test DID into a
    // static DID document
    let mut did_resolver = ssi::dids::StaticDIDResolver::new();
    did_resolver.insert(did_holder, did_doc_holder);
    did_resolver.insert(did_tp, did_doc_tp);

    // Turn the DID resolver into a verification method resolver by setting
    // resolution options
    let resolver = did_resolver.into_vm_resolver();

    // Create a verifier using the verification method resolver
    let v = VerificationParameters::from_resolver(resolver);
    v.with_date_time(Utc::now())
}

#[cfg(test)]
mod tests {

    use super::*;
    use std::fs;

    #[tokio::test]
    async fn verify_vc_self_issued() {
        let vc_json = fs::read_to_string("tests/credentials/credential-self-issued.json").unwrap();
        assert!(matches!(
            verify_vc(&vc_json).await.unwrap(),
            VerificationResult::VcValid(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_self_issued_tampered() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-self-issued-tampered.json").unwrap();
        assert!(matches!(
            verify_vc(&vc_json).await.unwrap_err(),
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
            verify_vc(&vc_json).await.unwrap(),
            VerificationResult::VcValid(_)
        ));

        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-not-expired.json")
                .unwrap();
        assert!(matches!(
            verify_vc(&vc_json).await.unwrap(),
            VerificationResult::VcValid(_)
        ));
    }

    #[tokio::test]
    async fn verify_vc_tp_issued_expired() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-expired.json")
                .unwrap();
        assert!(matches!(
            verify_vc(&vc_json).await.unwrap_err(),
            VerificationResult::VcValidationErrorExpired(_)
        ));
    }

    #[tokio::test]
    async fn verify_vp_single_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-single-vc.json").unwrap();
        let x = verify_vp(&vp_json).await.unwrap();
        assert_eq!(x.len(), 1);
        assert!(matches!(x[0], VerificationResult::VcValid(_)));
    }

    #[tokio::test]
    async fn verify_vp_multiple_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-multiple-vc.json").unwrap();
        let x = verify_vp(&vp_json).await.unwrap();
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
        let x = verify_vp(&vp_json).await.unwrap();
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
        let x = verify_vp(&vp_json).await.unwrap();
        assert_eq!(x.len(), 1);
        assert!(matches!(x[0], VerificationResult::VcProofErrorSignature(_)));
    }

    /*
    TODO holder validation TG-190
    #[tokio::test]
    async fn verify_vp_tampered_holder() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-tampered-holder.json").unwrap();
        let x = verify_vp(&vp_json).await.unwrap();
        assert_eq!(x.len(), 1);
        assert!(matches!(x[0], VcVerificationResult::VcProofErrorSignature));
    }
    */
}
