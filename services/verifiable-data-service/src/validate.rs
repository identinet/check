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
use ssi::prelude::*;

fn get_jws_payload(jws_string: String) -> Result<(JwsBuf, String), FromUtf8Error> {
    let credential_jwt = JwsBuf::new(jws_string).expect("invalid JWS");
    let payload = credential_jwt
        .decode_payload(&credential_jwt.decode_header().expect("unable to decode JWS header"))
        .expect("unable to decode JWS payload");
    Ok((credential_jwt.clone(), String::from_utf8(payload.into()).expect("unable to convert payload into String")))
}

struct VerifyingClaimsDecoder;

/// The decoder only decodes the payload.
impl ClaimsDecoder<serde_json::Value> for VerifyingClaimsDecoder {
    fn decode<'a>(
        &self,
        value: &'a serde_json::Value,
        format: &ClaimFormatDesignation,
        _format_constraint: Option<&ClaimFormatPayload>,
    ) -> Result<(serde_json::Value, Option<Cow<'a, serde_json::Value>>), ClaimDecodingError> {
        println!("decode value {}", serde_json::to_string(value).unwrap());
        println!("format {:?}", format);
        println!("format_constraint {:?}", _format_constraint);
        match format {
            ClaimFormatDesignation::JwtVpJson | ClaimFormatDesignation::JwtVcJson => {
                let jws: String = serde_json::from_value(value.clone()).expect("unable to convert value to string");
                let (_jwt, payload) = get_jws_payload(jws).expect("unable to decode JWS payload");
                let payload_json: serde_json::Value =
                    serde_json::from_str(&payload).expect("unable to deserialize payload");
                println!("decoded payload {}", payload_json);
                Ok((payload_json.clone(), Some(Cow::Owned(payload_json))))
            }
            ClaimFormatDesignation::LdpVp => {
                let str: String = serde_json::from_value(value.clone()).expect("unable to convert value to string");
                let payload_json: serde_json::Value =
                    serde_json::from_str(&str).expect("unable to deserialize payload");
                Ok((payload_json.clone(), Some(Cow::Owned(payload_json.clone()))))
            }
            ClaimFormatDesignation::LdpVc => {
                // No decoding required
                Ok((value.clone(), Some(Cow::Owned(value.clone()))))
            }
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
            println!("presetation_submission: {}", serde_json::to_value(presentation_submission).unwrap());
            if !presentation_submission.definition_id().eq(session.presentation_definition.id()) {
                Outcome::Failure {
                    reason: format!(
                        "Submission is for a different definition, IDs don't match: expected: {} got: {}",
                        session.presentation_definition.id(),
                        presentation_submission.definition_id()
                    ),
                }
            } else {
                let presetation_submission = serde_json::to_value(data.vp_token()).unwrap();
                let matching_inputs = data
                    .presentation_submission
                    .find_and_validate_inputs(
                        &session.presentation_definition,
                        &presetation_submission,
                        &VerifyingClaimsDecoder,
                    )
                    .unwrap();
                // TODO: verify Jws here
                // println!("res.inputs {:?}", res.inputs);
                // session.presentation_definition.is_credential_match(credential);

                for input in matching_inputs.inputs.iter() {
                    println!("id {}, format {}", input.descriptor_id, input.format);
                }

                // 2. Validate the integrity, authenticity, and Holder Binding of any Verifiable Presentation provided in the VP
                //    Token according to the rules of the respective Presentation format. See Section 12.1 for the checks required
                //    to prevent replay of a VP.
                // 3. Perform the checks on the Credential(s) specific to the Credential Format (i.e., validation of the
                //    signature(s) on each VC).
                // 4. Confirm that the returned Credential(s) meet all criteria sent in the Presentation Definition in the
                //    Authorization Request.
                // 5. Perform the checks required by the Verifier's policy based on the set of trust requirements such as trust
                //    frameworks it belongs to (i.e., revocation checks), if applicable.
                Outcome::Success { info: "All validated".into() }
            }
        }
        AuthorizationResponse::Jwt(data) => {
            // TODO: implement support for JWT submissions
            println!("response, jwt {:?}", data.response);
            Outcome::Error { cause: "JWT submissions not supported".into() }
        }
    };
    let f = future::ready(outcome);
    Box::pin(f)
}
