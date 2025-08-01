use openid4vp::{
    core::{
        credential_format::{ClaimFormatDesignation, ClaimFormatPayload},
        presentation_submission::{ClaimDecodingError, ClaimsDecoder, MatchingInputs},
        response::AuthorizationResponse,
    },
    verifier::session::Session,
};
use openid4vp_frontend::Outcome;
use serde_json::Value;
use serde_json_path::JsonPath;
use ssi::{dids::DIDBuf, prelude::*};
use std::{borrow::Cow, string::FromUtf8Error};
use verification_service::{dto::VerificationResult, verify_vc, verify_vp};

#[derive(Debug)]
struct VerifyingClaimsDecoder;

/// The decoder only decodes the payload.
impl ClaimsDecoder<serde_json::Value> for VerifyingClaimsDecoder {
    fn decode<'a>(
        &self,
        value: &'a serde_json::Value,
        format: &ClaimFormatDesignation,
        _format_constraint: Option<&ClaimFormatPayload>,
    ) -> Result<(serde_json::Value, Option<Cow<'a, serde_json::Value>>), ClaimDecodingError> {
        // println!("decode value {}", serde_json::to_string(value).unwrap());
        // println!("format {:?}", format);
        // println!("format_constraint {:?}", _format_constraint);
        match format {
            ClaimFormatDesignation::JwtVpJson | ClaimFormatDesignation::JwtVcJson => {
                let jws: String = serde_json::from_value(value.clone()).expect("unable to convert value to string");
                let (_jwt, payload) = get_jws_payload(jws).expect("unable to decode JWS payload");
                let payload_json: serde_json::Value =
                    serde_json::from_str(&payload).expect("unable to deserialize payload");
                // println!("decoded payload {}", payload_json);
                Ok((value.clone(), Some(Cow::Owned(payload_json))))
            }
            ClaimFormatDesignation::LdpVp => {
                let str: String = serde_json::from_value(value.clone()).expect("unable to convert value to string");
                let payload_json: serde_json::Value =
                    serde_json::from_str(&str).expect("unable to deserialize payload");
                Ok((value.clone(), Some(Cow::Owned(payload_json.clone()))))
            }
            ClaimFormatDesignation::LdpVc => {
                // No decoding required
                Ok((value.clone(), Some(Cow::Owned(value.clone()))))
            }
            _ => Err(ClaimDecodingError::UnknownFormat(format.clone())),
        }
    }
}

/// Retrieves the holder ID from the first presentation that is listed in matching_inputs and returns it.
fn get_holder_id(matching_inputs: &MatchingInputs<'_, Value>) -> Result<String, String> {
    let holder_path = match JsonPath::parse("$.holder") {
        Ok(value) => value,
        Err(e) => {
            println!("Error {e}");
            return Err("JSONPath error".into());
        }
    };
    for input in matching_inputs.inputs.iter() {
        // Convert String value to JSON
        let value = match input.value.clone() {
            Value::String(s) => serde_json::from_str(&s).unwrap_or(input.value.clone()),
            _ => input.value.clone(),
        };
        match input.format {
            ClaimFormatDesignation::JwtVpJson => {
                // TODO: add support for JwtVps
                break;
            }
            ClaimFormatDesignation::LdpVp => {
                // determine holder ID
                match holder_path.query(&value).exactly_one() {
                    Ok(node) => match serde_json::from_value(node.clone()) {
                        Ok(value) => {
                            return Ok(value);
                        }
                        Err(e) => {
                            println!("Error {e}");
                            return Err("JSONPath decoding error".into());
                        }
                    },
                    Err(e) => {
                        println!("Error {e}");
                        return Err("JSONPath error".into());
                    }
                }
            }
            _ => continue,
        }
    }
    Err("Unable to determine holder ID".into())
}

fn get_jws_payload(jws_string: String) -> Result<(JwsBuf, String), FromUtf8Error> {
    let credential_jwt = JwsBuf::new(jws_string).expect("invalid JWS");
    let payload = credential_jwt
        .decode_payload(&credential_jwt.decode_header().expect("unable to decode JWS header"))
        .expect("unable to decode JWS payload");
    Ok((credential_jwt.clone(), String::from_utf8(payload.into()).expect("unable to convert payload into String")))
}

/// Validates the submitted presentation.
///
/// Follows <https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-vp-token-validation>
///
/// It looks like there's no defined behavior for when the validation fails. Therefore, we'll have to create an
/// implementation specific response.
pub async fn validate(session: Session, response: AuthorizationResponse) -> Outcome {
    // println!("validate");
    let outcome = match session.presentation_definition {
        Some(presentation_definition) => {
            // println!("presentation_definition {}", serde_json::to_string(&presentation_definition).unwrap());
            match response {
                AuthorizationResponse::Unencoded(data) => {
                    // 1. Determine the number of VPs returned in the VP Token and identify in which VP which requested VC is
                    //    included, using the Input Descriptor Mapping Object(s) in the Presentation Submission.

                    // Basic verification of to ensure that definition and submission fit
                    let presentation_submission = data.presentation_submission();
                    // println!("presetation_submission: {}", serde_json::to_value(presentation_submission).unwrap());
                    if !presentation_submission.definition_id().eq(presentation_definition.id()) {
                        Outcome::Failure {
                            reason: format!(
                                "Submission is for a different definition, IDs don't match: expected: {} got: {}",
                                presentation_definition.id(),
                                presentation_submission.definition_id()
                            ),
                        }
                    } else {
                        let vp_token = serde_json::to_value(data.vp_token());
                        let vp_token = match vp_token {
                            Ok(value) => value,
                            Err(_e) => {
                                return Outcome::Error { cause: "Decoding error".into() };
                            }
                        };
                        let matching_inputs = match data.presentation_submission.find_and_validate_inputs(
                            &presentation_definition,
                            &vp_token,
                            &VerifyingClaimsDecoder,
                        ) {
                            Ok(value) => value,
                            Err(_e) => {
                                return Outcome::Error { cause: "Decoding error".into() };
                            }
                        };
                        // 2. Validate the integrity, authenticity, and Holder Binding of any Verifiable Presentation provided in the VP
                        //    Token according to the rules of the respective Presentation format. See Section 12.1 for the checks required
                        //    to prevent replay of a VP.
                        // 3. Perform the checks on the Credential(s) specific to the Credential Format (i.e., validation of the
                        //    signature(s) on each VC).
                        // 4. Confirm that the returned Credential(s) meet all criteria sent in the Presentation Definition in the
                        //    Authorization Request.
                        let expected_id = match get_holder_id(&matching_inputs) {
                            Ok(value) => match DIDBuf::from_string(value) {
                                Ok(did) => did,
                                Err(_e) => {
                                    return Outcome::Error { cause: "Invalid DID".into() };
                                }
                            },
                            Err(e) => {
                                return Outcome::Error { cause: e };
                            }
                        };

                        return verify_submission(&matching_inputs, &expected_id, true).await;
                        // TODO:
                        // 5. Perform the checks required by the Verifier's policy based on the set of trust requirements such as trust
                        //    frameworks it belongs to (i.e., revocation checks), if applicable.
                    }
                }
                AuthorizationResponse::Jwt(data) => {
                    // TODO: implement support for JWT submissions
                    // println!("response, jwt {:?}", data.response);
                    Outcome::Error { cause: "JWT submissions not supported".into() }
                }
            }
        }
        None => Outcome::Error { cause: "Presentation definition empty".into() },
    };
    outcome
}

/// Verifies matching_inputs and ensures that the expected_id matches.
async fn verify_submission(
    matching_inputs: &MatchingInputs<'_, Value>,
    expected_id: &DIDBuf,
    allow_missing_subjectid: bool,
) -> Outcome {
    let mut results = vec![];
    // verify all matching inputs
    for input in matching_inputs.inputs.iter() {
        // Convert String value to JSON
        let value = match input.value.clone() {
            Value::String(s) => serde_json::from_str(&s).unwrap_or(input.value.clone()),
            _ => input.value.clone(),
        };
        // if a matching input is an array, look at the first element
        let value = match value.clone() {
            Value::Array(values) => values.first().cloned().unwrap_or(value.clone()),
            _ => value.clone(),
        };
        match input.format {
            ClaimFormatDesignation::JwtVpJson | ClaimFormatDesignation::JwtVcJson => {
                // TODO: add support for JwtVps and JwtVcs
                results.push(VerificationResult::vp_proof_error("JwtVpJson is not supported".into()))
            }
            ClaimFormatDesignation::LdpVp => match verify_vp(&value.to_string(), expected_id, false).await {
                Ok(v) => {
                    if v.len() == 1 {
                        results.push(v[0].clone());
                    } else {
                        results.push(VerificationResult::vp_proof_error(
                            "Verification failed, number of verification results unequal to 1".into(),
                        ))
                    }
                }
                Err(e) => results.push(e),
            },
            ClaimFormatDesignation::LdpVc => {
                match verify_vc(&value.to_string(), expected_id, allow_missing_subjectid).await {
                    Ok(r) => results.push(r),
                    Err(r) => results.push(r),
                }
            }
            _ => results.push(VerificationResult::vc_proof_error("Claim type not supported".into())),
        }
    }
    if results.is_empty() {
        return Outcome::Error { cause: "Not enough inputs received".into() };
    }
    if results.iter().all(|r| r.clone().into_result().is_ok()) {
        return Outcome::Success { info: "Verification successed".into() };
    }
    Outcome::Failure { reason: "Verification failed".into() }
}
