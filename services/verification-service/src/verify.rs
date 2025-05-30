/*
use didkit to generate jwk + did-docs
e.g. DID_METHOD=jwk ./gen.sh

- sample key pairs
  - retailer key
  - trust party key
- happy path
  - TP VC in R presentation
  - TP VC + R VC in R presentation
- errors
  - holder <> subject.id mismatch (single VC pres and multiple VC presentation)
  - expired VC(s)
  - tampered VC
  - tampered presentation
  - wrong key (?)

- test cases
  - VP with single VC
  - VP with multiple VCs, no expiry dates
  - VP with multiple VCs, with expiry dates, not expired

- VP with multiple VCs, with expiry date, expired
- VP with multiple VCs, bad VP proof
- VP with multiple VCs, one VC with bad VC proof (VP proof ok)

  - VP with different holder than VC.credentialSubject.id

- verify VP
  - tampered VC -> boom - FAIL
    -> manually verify nested VCs
  - tampered VP -> boom - OK
  - expired VC - FAIL (but OK when VC is verified directly)
    -> manual check - OK


https://mhrsntrk.com/blog/create-and-publish-your-own-did-web
https://www.sprucekit.dev/verifiable-digital-credentials/didkit/didkit-examples/core-functions-cli
https://mkjwk.org/

https://github.com/spruceid/ssi/blob/82b0bf3915cc285465c9dce74e7c5774a795ce4e/crates/dids/core/src/example.rs
spruceid/ssi crates/dids/core/tests/vectors/did-example-foo.json
spruceid/ssi crates/dids/core/src/example.rs
spruceid/ssi examples/issue.rs
*/

use ssi::claims::chrono::Utc;
use ssi::claims::data_integrity::AnyDataIntegrity;
use ssi::claims::vc::v1::data_integrity::any_credential_from_json_str;
use ssi::claims::vc::v1::Credential;
use ssi::claims::vc::v1::JsonPresentation;
use ssi::claims::VerificationParameters;
use ssi::dids::DIDResolver;
use ssi::dids::StaticDIDResolver;
use ssi::dids::VerificationMethodDIDResolver;
use ssi::verification_methods::AnyMethod;
use tokio::task::JoinSet;

/// Verifies the given Verifiable Presentation and all included Verifiable
/// Credentials.
pub async fn verify_vp(vp_json: &String) -> bool {
    // Create DataIntegrity from JSON string
    let vp: AnyDataIntegrity<JsonPresentation> = match serde_json::from_str(&vp_json) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to parse VP JSON: {}", e);
            return false;
        }
    };

    // Verify the presentation's proof
    let verifier = create_verifier();
    match vp.verify(&verifier).await {
        Err(proof_err) => {
            eprintln!("Presentation proof error: {:?}", proof_err);
            return false;
        }
        Ok(Err(verification_err)) => {
            eprintln!("Presentation verification error: {}", verification_err);
            return false;
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
            // it should be safe to unwrap the result as we just deserialized the whole VP
            // => serializing the VC should work without errors
            let vc_json = serde_json::to_string(&vc).unwrap();
            verify_vc(&vc_json).await
        })
        .collect();

    let results = tasks.join_all().await;
    let all_valid = results.iter().all(|&r| r);

    if all_valid {
        println!("All credentials verified successfully.");
    } else {
        println!("One or more credentials failed verification.");
    }

    all_valid
}

/// Verifies the given VC and validates the contained claims.
/// I.e. checks the cryptographic proof and verifies that the claims themselves
/// are consistent and valid (e.g. expiration date has not passed, yet).
async fn verify_vc(vc_json: &String) -> bool {
    let vc = match any_credential_from_json_str(&vc_json) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to parse credential JSON: {:?}", e);
            return false;
        }
    };

    // Prepare our verifier
    // TODO can we avoid doing this with every verify_vc invocation?
    let verifier = create_verifier();
    match vc.verify(&verifier).await {
        Ok(Ok(())) => {
            println!("Credential verified successfully.");
            match vc.validate_credential(&verifier) {
                Ok(()) => true,
                Err(e) => {
                    eprintln!("Credential validation failed: {}", e);
                    false
                }
            }
        }
        Ok(Err(e)) => {
            eprintln!("Credential verification failed: {}", e);
            false
        }
        Err(e) => {
            eprintln!("Credential proof error: {:?}", e);
            false
        }
    }
}

fn create_verifier(
) -> VerificationParameters<VerificationMethodDIDResolver<StaticDIDResolver, AnyMethod>> {
    let did_holder = include_str!("../tests/dids/did-holder")
        .trim()
        .parse()
        .unwrap();
    let did_doc_holder = ssi::dids::resolution::Output::from_content(
        include_bytes!("../tests/dids/did-doc-holder.json").to_vec(),
        Some("application/did+json".to_owned()),
    );

    let did_tp = include_str!("../tests/dids/did-trust-party")
        .trim()
        .parse()
        .unwrap();
    let did_doc_tp = ssi::dids::resolution::Output::from_content(
        include_bytes!("../tests/dids/did-doc-trust-party.json").to_vec(),
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
        assert_eq!(verify_vc(&vc_json).await, true);
    }

    #[tokio::test]
    async fn verify_vc_self_issued_tampered() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-self-issued-tampered.json").unwrap();
        assert_eq!(verify_vc(&vc_json).await, false);
    }

    #[tokio::test]
    async fn verify_vc_tp_issued_no_expiration() {
        let vc_json = fs::read_to_string(
            "tests/credentials/credential-trust-party-issued-no-expiration-date.json",
        )
        .unwrap();
        assert_eq!(verify_vc(&vc_json).await, true);

        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-not-expired.json")
                .unwrap();
        assert_eq!(verify_vc(&vc_json).await, true);
    }

    #[tokio::test]
    async fn verify_vc_tp_issued_expired() {
        let vc_json =
            fs::read_to_string("tests/credentials/credential-trust-party-issued-expired.json")
                .unwrap();
        assert_eq!(verify_vc(&vc_json).await, false);
    }

    #[tokio::test]
    async fn verify_vp_single_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-single-vc.json").unwrap();
        assert_eq!(verify_vp(&vp_json).await, true);
    }

    #[tokio::test]
    async fn verify_vp_multiple_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-multiple-vc.json").unwrap();
        assert_eq!(verify_vp(&vp_json).await, true);
    }

    #[tokio::test]
    async fn verify_vp_multiple_vc_expired() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-multiple-vc-expired.json")
                .unwrap();
        assert_eq!(verify_vp(&vp_json).await, false);
    }

    #[tokio::test]
    async fn verify_vp_tampered_vc() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-tampered-vc.json").unwrap();
        assert_eq!(verify_vp(&vp_json).await, false);
    }

    #[tokio::test]
    async fn verify_vp_tampered_holder() {
        let vp_json =
            fs::read_to_string("tests/presentations/presentation-tampered-holder.json").unwrap();
        assert_eq!(verify_vp(&vp_json).await, false);
    }
}

/*
verify_vp with JoinSet spawn (verifier not moved)

    for vc in vp.claims.verifiable_credentials {
        join_set.spawn(async move {
            let vc_json = match serde_json::to_string(&vc) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Failed to serialize credential: {}", e);
                    return false;
                }
            };

            let di_vc = match any_credential_from_json_str(&vc_json) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Failed to parse credential JSON: {:?}", e);
                    return false;
                }
            };

            match di_vc.verify(&verifier).await {
                Ok(Ok(())) => {
                    println!("Credential verified successfully.");
                    true
                }
                Ok(Err(e)) => {
                    eprintln!("Credential verification failed: {}", e);
                    false
                }
                Err(e) => {
                    eprintln!("Credential proof error: {:?}", e);
                    false
                }
            }
        });
    }

    Collect results
    let mut all_valid = true;
    while let Some(result) = join_set.join_next().await {
        match result {
            Ok(valid) => {
                if !valid {
                    all_valid = false;
                }
            }
            Err(e) => {
                eprintln!("Task join error: {}", e);
                all_valid = false;
            }
        }
}

 */

/*
verify_vp with futures

// Now verify each credential inside the presentation
let results = join_all(vp.claims.verifiable_credentials.into_iter().map(
    |vc: SpecializedJsonCredential| {
        // let verifier = verifier.clone();
        async move {
            // TODO find more performant way to transfrom SpecializedJsonCredential to AnyDataIntegrity
            // without serialization roundtrips
            let vc_json = match serde_json::to_string(&vc) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Failed to serialize credential: {}", e);
                    return false;
                }
            };

            // Create AnyDataIntegrity (currently only possible from string)
            let di_vc = match any_credential_from_json_str(&vc_json) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Failed to parse credential JSON: {:?}", e);
                    return false;
                }
            };

            // Verify nested credential. Currently not implemented by SSI lib.
            // See https://github.com/spruceid/ssi/issues/441
            match di_vc.verify(&verifier).await {
                Ok(Ok(())) => {
                    println!("Credential verified successfully.");
                    match vc.validate_credential(&verifier) {
                        Ok(()) => true,
                        Err(e) => {
                            eprintln!("Credential validation failed: {}", e);
                            false
                        }
                    }
                    // true
                }
                Ok(Err(e)) => {
                    eprintln!("Credential verification failed: {}", e);
                    false
                }
                Err(e) => {
                    eprintln!("Credential proof error: {:?}", e);
                    false
                }
            }
        }
    },
))
.await;

let all_valid = results.iter().all(|&r| r);
*/

/*
async fn verify_vp2(vp_json: &String) {
    // Load the credential textual representation from the file system.
    // let vp_json = fs::read_to_string("tests/presentations/presentation-single-vc.json").unwrap();

    // let vp: AnyDataIntegrity<AnyJsonPresentation> = serde_json::from_str(&vp_json).unwrap();
    let vp: AnyDataIntegrity<JsonPresentation> = serde_json::from_str(vp_json).unwrap();
    // let x = ssi::claims::JsonPresentationOrJws::Presentation(vc_ldp);
    // let vp: JsonPresentation = serde_json::from_str(&vp_json).expect("Invalid VP JSON");
    // vp.
    // use chrono::{DateTime, Local};

    // println!("VP claims: {:?}", vp.claims.verifiable_credentials);
    // println!("VP holder: {:?}", vp.claims.holder);

    let verifier = create_verifier();
    // let result = vp.verify(&verifier).await.unwrap();
    let result = vp.verify(&verifier).await;

    if result.is_err() {
        let proof_err = result.unwrap_err();
        println!("Proof Error! {:?}", proof_err);
    } else {
        let verification = result.unwrap();
        if verification.is_err() {
            let verification_err = verification.unwrap_err();
            println!("Verification Error! {}", verification_err.to_string());
        } else {
            println!("Success!");
        }
    }

    let x = vp
        .claims
        .verifiable_credentials
        .into_iter()
        .map(|vc: SpecializedJsonCredential| {
            // DateTimeProvider::date_time(&self)
            // let x: AnyDataIntegrity = Into::into(vc);
            // let claim: VerifiableCredential = vc;
            // let di: AnyDataIntegrity<JsonCredential> =
            //     DataIntegrity::from_jwt_claims(vc.to_jwt_claims().unwrap()).unwrap();
            // let vc_data_integrity: AnyDataIntegrity<JsonCredential> = vc.into();

            // let vc_str = serde_json::to_string(&vc).unwrap();
            // let integrity =
            //     ssi::claims::vc::v1::data_integrity::any_credential_from_json_str(&vc_str).unwrap();
            // let vc_res = integrity.verify(&verifier).await.unwrap();

            let json_bytes = serde_json::to_vec(&vc).unwrap();
            let di_vc =
                ssi::claims::vc::v1::data_integrity::any_credential_from_json_slice(&json_bytes);
            // let vc_res = integrity.verify(&verifier).await.unwrap();

            // TODO match holder with subject.id
            let subject = vc.credential_subjects.first().unwrap();
            // println!("VC subject.id: {:?}", subject);
            vc.validate_credential(&verifier).is_ok()
        })
        // .reduce(|acc, v| {
        //     println!("reduce, acc: {:?}, v: {:?}", acc, v);
        //     acc && v
        // })
        .fold(true, |acc, v| {
            // println!("fold, acc: {:?}, v: {:?}", acc, v);
            acc && v
        });
    // .unwrap_or(false);

    println!("All creds valid? {:?}", x);

    // Parse the Verifiable Presentation JSON
    // let vp: Value = serde_json::from_str(&vp_json).expect("Invalid VP JSON");

    // let verifier = create_verifier();

    // let mut did_resolver = ssi::dids::StaticDIDResolver::new();
    // did_resolver.insert(
    //     "did:jwk:eyJjcnYiOiJFZDI1NTE5Iiwia3R5IjoiT0tQIiwieCI6IlJGbWl6UTB6TmsyR0loSnB5MEFwV29UOHBhSGFjYWJVdXRoNUFGQXJtU2MifQ".parse().unwrap(),
    //     ssi::dids::resolution::Output::from_content(
    //         include_bytes!("../tests/did_doc.json").to_vec(),
    //         Some("application/did+json".to_owned()),
    //     ),
    // );

    // Turn the DID resolver into a verification method resolver by setting
    // resolution options
    // let resolver = did_resolver.into_vm_resolver();

    // Set up the DID Resolver (you can use ExampleDIDResolver for this demo)
    // let resolver = ExampleDIDResolver::default().into_vm_resolver::<DIDResolver>();

    // Optional: Set proof options for verification (for example, Authentication proof purpose)
    // let proof_options = ProofOptions {
    //     proof_purpose: Some(ProofPurpose::Authentication),
    //     ..Default::default()
    // };

    // Verify the Presentation
    // match Presentation::verify(&vp, proof_options, &resolver).await {
    //     Ok(()) => println!("VP is valid."),
    //     Err(e) => eprintln!("VP verification failed: {}", e),
    // }

    // Parse the VC

    // let vp =
    //     ssi::claims::vc::v1::data_integrity::any_credential_from_json_str(&presentation_content)
    //         .unwrap();
    // let vp: ssi::vc::VerifiablePresentation =
    //     serde_json::from_str(&presentation_content).expect("Invalid VP JSON");

    // ssi::claims::vc::v1::JsonPresentation::new(id, holder, verifiable_credentials)

    // Prepare our verifier
    // let verifier = create_verifier();

    // Verify the VC!
    // assert!(vp.verify(&verifier).await.unwrap().is_ok());
}
*/
