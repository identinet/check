use std::{
    borrow::Cow,
    future::{self, Future},
    pin::Pin,
    string::FromUtf8Error,
};

use openid4vp::{
    core::{
        credential_format::{ClaimFormatDesignation, ClaimFormatPayload},
        presentation_submission::{ClaimDecodingError, ClaimsDecoder},
        response::AuthorizationResponse,
    },
    verifier::session::Session,
};
use openid4vp_frontend::Outcome;
use serde_json_path::JsonPathExt;
use ssi::{
    claims::jws::{Base64DecodeError, DecodeError},
    dids::{resolution::HTTPDIDResolver, AnyDidMethod, DIDKey, VerificationMethodDIDResolver, DID},
    json_ld::iref::Uri,
    jwk::JWKResolver,
    prelude::*,
    verification_methods::{GenericVerificationMethod, JwkVerificationMethod},
};
use tokio::sync::oneshot;

struct VerifyingClaimsDecoder;

fn get_jws_payload(string: &str) -> Result<String, FromUtf8Error> {
    let credential_jwt = JwsBuf::new(string.to_string()).expect("invalid JWS");
    let payload = credential_jwt
        .decode_payload(&credential_jwt.decode_header().expect("unable to decode JWS header"))
        .expect("unable to decode JWS payload");
    String::from_utf8(payload.into())
}

/// The decoder not only decodes but also verifies the authenticity of the payload. It returns the resulting value - if
/// JWT, the header and signature are stripped.
impl ClaimsDecoder<serde_json::Value> for VerifyingClaimsDecoder {
    /// Returns verified, decode input.
    fn decode<'a>(
        &self,
        value: &'a serde_json::Value,
        format: &ClaimFormatDesignation,
        _format_constraint: Option<&ClaimFormatPayload>,
    ) -> Result<(serde_json::Value, Option<Cow<'a, serde_json::Value>>), ClaimDecodingError> {
        println!("decode {}", serde_json::to_string(value).unwrap());
        println!("format_constraint {:?}", _format_constraint);
        match format {
            ClaimFormatDesignation::JwtVpJson => {
                println!("JwtVpJson");
                let vp_token: String = serde_json::from_value(value.clone())
                    // .map_err(|e| ClaimDecodingError::Invalid(e.to_string()))
                    .expect("unable to convert value to string");
                // let vp_jwt = JwsBuf::new(vp_token).expect("invalid JWS");
                // let payload = vp_jwt
                //     .decode_payload(&vp_jwt.decode_header().expect("unable to decode JWS header"))
                //     .expect("unable to decode JWS payload");
                let vp_payload = get_jws_payload(vp_token.as_str()).expect("unable to decode JWS payload");
                let mut vp_payload_json: serde_json::Value =
                    serde_json::from_str(&vp_payload).expect("unable to deserialize payload");
                println!("json vp {}", vp_payload_json);
                let path = serde_json_path::JsonPath::parse("$.vp.verifiableCredential[:]").expect("invalid JSONPath");
                // let mut vcs = Vec::new();
                // let credentials = path.query(&vp_payload_json);
                // println!("found {} credentials", credentials.len());
                // for vc in credentials.iter() {
                //     if vc.is_string() {
                //         println!("credential {}", vc);
                //         let vc_payload = get_jws_payload(vc.as_str().unwrap()).expect("unable to decode JWS payload");
                //         // let credential_jwt = JwsBuf::new(credential.as_str().unwrap()).expect("invalid JWS");
                //         // let payload = credential_jwt
                //         //     .decode_payload(
                //         //         &credential_jwt.decode_header().expect("unable to decode JWS header"),
                //         //     )
                //         //     .expect("unable to decode JWS payload");
                //         // let res_credential: serde_json::Value =
                //         //     serde_json::from_str(credential.as_str().unwrap())
                //         //         .expect("unable to deserialize credential");
                //         // decode JWT
                //         println!("json vc {}", vc_payload);
                //         let vc_payload_json: serde_json::Value =
                //             serde_json::from_str(&vc_payload).expect("unable to deserialize payload");
                //         vcs.push(vc_payload_json);
                //     } else {
                //         // TODO: maybe a LdpVpJson could also be shipped inside a JwtVpJson .. so this would be
                //         // an object and should be supported
                //         println!("credential is not a string, ignoring it");
                //         continue;
                //     }
                // }
                vp_payload_json.pointer_mut("/vp/verifiableCredential").map(|v| {
                    if v.is_array() {
                        let mut vcs = Vec::new();
                        for vc in v.as_array().unwrap().iter() {
                            if vc.is_string() {
                                println!("credential {}", vc);
                                let vc_payload =
                                    get_jws_payload(vc.as_str().unwrap()).expect("unable to decode JWS payload");
                                // let credential_jwt = JwsBuf::new(credential.as_str().unwrap()).expect("invalid JWS");
                                // let payload = credential_jwt
                                //     .decode_payload(
                                //         &credential_jwt.decode_header().expect("unable to decode JWS header"),
                                //     )
                                //     .expect("unable to decode JWS payload");
                                // let res_credential: serde_json::Value =
                                //     serde_json::from_str(credential.as_str().unwrap())
                                //         .expect("unable to deserialize credential");
                                // decode JWT
                                println!("json vc {}", vc_payload);
                                let vc_payload_json: serde_json::Value =
                                    serde_json::from_str(&vc_payload).expect("unable to deserialize payload");
                                vcs.push(vc_payload_json);
                            } else {
                                // TODO: maybe a LdpVpJson could also be shipped inside a JwtVpJson .. so this would be
                                // an object and should be supported
                                println!("credential is not a string, ignoring it");
                                continue;
                            }
                        }
                        *v = vcs.into();
                    }
                });
                println!("vp_payload_json {}", vp_payload_json);
                // let res = serde_json::to_value(json_payload)
                //     .expect("unable do encode deserialized payload into value");
                // FIXME: what is the ID I should return here?
                Ok((value.clone(), Some(Cow::Owned(vp_payload_json))))
                // let http_resolver =
                //     HTTPDIDResolver::new(Uri::new("https://dev.uniresolver.io/").expect("unable to parse URI")); // TODO: read external resolver from config
                // let resolver = AnyDidMethod::default();
                // let vm_resolver: VerificationMethodDIDResolver<AnyDidMethod, dyn JwkVerificationMethod> =
                //     VerificationMethodDIDResolver::new(resolver);
                // let params = VerificationParameters::from_resolver(vm_resolver);
                //
                // let (tx, rx) = oneshot::channel();
                // tokio::spawn(async move {
                //     let verification_result = vp_jwt.verify(&params).await.expect("verification failed").is_ok();
                //     let _ = tx.send(verification_result);
                // });
                // let result = rx.blocking_recv().unwrap();
                //
                // // TODO: walk through every credential and verify it
                //
                // let decoded_value = serde_json::to_value("".to_string()).expect("unable to convert value");
                // Ok(((), Some(Cow::Owned(decoded_value))))
            }
            // ClaimFormatDesignation::LdpVp => { }, // TODO: support it
            _ => Err(ClaimDecodingError::UnknownFormat(format.clone())),
        }
    }
}

/// Validates the submitted presentation.
/// Follows https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-vp-token-validation
/// INFO: it looks like there's no defined behavior for when the validation fails. Therefore, we'll have to create an
/// implementation specific response.
pub fn validate(session: Session, response: AuthorizationResponse) -> Pin<Box<impl Future<Output = Outcome>>> {
    println!("validate");
    println!("response {:?}", response);
    println!("presentation_definition {}", serde_json::to_string(&session.presentation_definition).unwrap());
    let outcome = match response {
        AuthorizationResponse::Unencoded(data) => {
            // 1. Determine the number of VPs returned in the VP Token and identify in which VP which requested VC is
            //    included, using the Input Descriptor Mapping Object(s) in the Presentation Submission.

            // Basic verification of to ensure that definition and submission fit
            let presentation_submission = data.presentation_submission();
            if !presentation_submission.definition_id().eq(session.presentation_definition.id()) {
                Outcome::Failure {
                    reason: format!(
                        "Submission is for a different definition, IDs don't match: expected: {} got: {}",
                        session.presentation_definition.id(),
                        presentation_submission.definition_id()
                    )
                    .into(),
                }
            } else {
                // ignore all credentials and input descriptors that have no requirements
                // println!("presentation_submission {}", serde_json::to_string(data.presentation_submission()).unwrap());
                // println!("vp_token {}", serde_json::to_string(data.vp_token()).unwrap());
                // TODO: the VP token must be decode before it gets submitted???? otherwise the path query will not work,
                // right?
                // TODO: Find out how find_and_validate_inputs is used
                let presetation_submission = serde_json::to_value(&data.vp_token()).unwrap();
                let res = data
                    .presentation_submission
                    .find_and_validate_inputs(
                        &session.presentation_definition,
                        &presetation_submission,
                        &VerifyingClaimsDecoder,
                    )
                    .unwrap();
                // println!("res.inputs {:?}", res.inputs);
                // session.presentation_definition.is_credential_match(credential);

                Outcome::Success { info: "All validated".into() }
            }
        }
        AuthorizationResponse::Jwt(data) => {
            // TODO: implement support for JWT submissions
            println!("response, jwt {:?}", data.response);
            Outcome::Error { cause: "JWT submissions not supported".into() }
        }
    };
    // 2. Validate the integrity, authenticity, and Holder Binding of any Verifiable Presentation provided in the VP
    //    Token according to the rules of the respective Presentation format. See Section 12.1 for the checks required
    //    to prevent replay of a VP.
    // 3. Perform the checks on the Credential(s) specific to the Credential Format (i.e., validation of the
    //    signature(s) on each VC).
    // 4. Confirm that the returned Credential(s) meet all criteria sent in the Presentation Definition in the
    //    Authorization Request.
    // 5. Perform the checks required by the Verifier's policy based on the set of trust requirements such as trust
    //    frameworks it belongs to (i.e., revocation checks), if applicable.
    // let o = Outcome::Success { info: "Successful validation".into() };
    // let o = Outcome::Failure { reason: "Verification failed".into() };
    let f = future::ready(outcome);
    Box::pin(f)
}
