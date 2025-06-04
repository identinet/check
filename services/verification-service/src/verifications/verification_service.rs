use ssi::{
    claims::{
        chrono::Utc,
        data_integrity::AnyDataIntegrity,
        vc::v1::{data_integrity::any_credential_from_json_str, Credential, JsonPresentation},
        VerificationParameters,
    },
    dids::{AnyDidMethod, VerificationMethodDIDResolver},
    verification_methods::AnyMethod,
};
use tokio::task::JoinSet;

use super::dto::VcVerificationResult;

pub async fn verify_presentations(
    presentations: Vec<JsonPresentation>,
) -> Vec<VcVerificationResult> {
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
            let b = match verify_vp(&vp_json).await {
                Ok(results) => results,
                Err(vp_error) => vp.verifiable_credentials.iter().map(|_| vp_error).collect(),
            };
            b
        })
        .collect();

    let results = tasks.join_all().await.into_iter().flatten().collect();
    results
}

/// Verifies the given Verifiable Presentation and all included Verifiable
/// Credentials.
// async fn verify_vp(vp_json: &String) -> bool {
async fn verify_vp(vp_json: &String) -> Result<Vec<VcVerificationResult>, VcVerificationResult> {
    // Create DataIntegrity from JSON string
    let vp: AnyDataIntegrity<JsonPresentation> = match serde_json::from_str(&vp_json) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to parse VP JSON: {}", e);
            return Err(VcVerificationResult::VpParseError);
            // return false;
        }
    };

    // Verify the presentation's proof
    let verifier = create_verifier();
    match vp.verify(&verifier).await {
        Err(proof_err) => {
            eprintln!("Presentation proof error: {:?}", proof_err);
            return Err(VcVerificationResult::VpProofError);
        }
        Ok(Err(verification_err)) => {
            eprintln!("Presentation verification error: {}", verification_err);
            return Err(VcVerificationResult::VpVerificationError);
        }
        Ok(Ok(())) => {
            println!("Presentation verified successfully.");
            // go on
        }
    }
    // Prepare verification tasks for each credential
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
            verify_vc(&vc_json).await
        })
        .collect();

    let results = tasks.join_all().await;
    let all_valid = results.iter().all(|r| match r {
        VcVerificationResult::VcValid => true,
        _ => false,
    });

    if all_valid {
        println!("All credentials verified successfully.");
    } else {
        println!("One or more credentials failed verification.");
    }

    // all_valid
    Ok(results)
}

/// Verifies the given VC and validates the contained claims.
/// I.e. checks the cryptographic proof and verifies that the claims themselves
/// are consistent and valid (e.g. expiration date has not passed, yet).
async fn verify_vc(vc_json: &String) -> VcVerificationResult {
    let vc = match any_credential_from_json_str(&vc_json) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to parse credential JSON: {:?}", e);
            return VcVerificationResult::VcParseError;
        }
    };

    // Prepare our verifier
    // TODO can we avoid doing this with every verify_vc invocation?
    let verifier = create_verifier();
    match vc.verify(&verifier).await {
        Ok(Ok(())) => {
            println!("Credential verified successfully.");
            match vc.validate_credential(&verifier) {
                Ok(()) => VcVerificationResult::VcValid,
                Err(e) => {
                    eprintln!("Credential validation failed: {}", e);
                    match e {
                        ssi::claims::InvalidClaims::MissingIssuanceDate => {
                            VcVerificationResult::VcValidationErrorMissingIssuance
                        }
                        ssi::claims::InvalidClaims::Premature {
                            now: _,
                            valid_from: _,
                        } => VcVerificationResult::VcValidationErrorPremature,
                        ssi::claims::InvalidClaims::Expired {
                            now: _,
                            valid_until: _,
                        } => VcVerificationResult::VcValidationErrorExpired,
                        ssi::claims::InvalidClaims::Other(_) => {
                            VcVerificationResult::VcValidationErrorOther
                        }
                    }
                }
            }
        }
        Ok(Err(e)) => {
            eprintln!("Credential verification failed: {}", e);
            VcVerificationResult::VcVerificationError
        }
        Err(e) => {
            eprintln!("Credential proof error: {:?}", e);
            VcVerificationResult::VcProofError
        }
    }
}

/// .
// fn create_verifier() -> VerificationParameters<AnyDidMethod> {
// fn create_verifier() -> VerificationParameters<VerificationMethodDIDResolver<AnyResolver, AnyMethod>>
fn create_verifier(
) -> VerificationParameters<VerificationMethodDIDResolver<AnyDidMethod, AnyMethod>> {
    // let resolver = AnyDidMethod::default();
    let resolver = VerificationMethodDIDResolver::<_, AnyMethod>::new(AnyDidMethod::default());

    // Create a verifier using the verification method resolver
    let v = VerificationParameters::from_resolver(resolver);
    v.with_date_time(Utc::now())
}
