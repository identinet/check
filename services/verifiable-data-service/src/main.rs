// Fail build if feature is requsted, see https://www.reddit.com/r/rust/comments/8oz7md/make_cargo_fail_on_warning/
#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]

mod config; // Import the config module
use config::AppConfig;
use tokio::sync::Mutex;

use std::{
    collections::HashMap,
    fs,
    future::{self, Future},
    net::SocketAddr,
    pin::Pin,
    sync::Arc,
};

use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
    routing::{get, post},
    Form, Router,
};
use openid4vp::{
    core::{
        authorization_request::{
            self,
            parameters::{ClientIdScheme, ResponseType},
        },
        credential_format::{self, ClaimFormatDesignation, ClaimFormatPayload},
        input_descriptor,
        metadata::{
            parameters::{
                verifier::VpFormats,
                wallet::{
                    AuthorizationEndpoint, RequestObjectSigningAlgValuesSupported, ResponseTypesSupported,
                    VpFormatsSupported,
                },
            },
            WalletMetadata,
        },
        object::UntypedObject,
        presentation_definition::{
            self, SubmissionRequirement, SubmissionRequirementBase, SubmissionRequirementObject,
            SubmissionRequirementPick,
        },
        presentation_submission::PresentationSubmission,
        response::{parameters::VpToken, AuthorizationResponse, PostRedirection, UnencodedAuthorizationResponse},
    },
    verifier::{self, session::Session, Verifier},
};
use openid4vp_frontend::{Outcome, Status};
use serde::{Deserialize, Serialize};
use ssi::{crypto::Algorithm, dids, verification_methods};
use url::Url;
use uuid::Uuid;

// Share data cache that stores data submitted to the service for future retrieval.
type DataCache = Arc<Mutex<HashMap<Uuid, DataEntry>>>;

#[derive(Debug, Clone, Default)]
struct DataEntry {
    nonce: String,
    vp_token: Option<VpToken>,
    presentation_submission: Option<PresentationSubmission>,
}

// impl Default for DataEntry {
//     fn default() -> Self {
//         DataEntry{nonce: "".to_string(), presentation_submission: None}
//     }
// }

// type LocalVerifier = Arc<Verifier>;

#[derive(Clone)]
struct AppState {
    config: AppConfig,
    // verifier: LocalVerifier, // INFO: apparently, we don't need to wrap the Verifier in an Arc
    verifier: Verifier,
    data_cache: DataCache,
}

/// Authorization Request URI Response.
/// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow
#[derive(Serialize, Deserialize)]
struct AuthRequestURIResponse {
    id: Uuid,
    url: Url,
}

/// Authorization Request Object Response.
/// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow
#[derive(Serialize, Deserialize)]
struct AuthRequestObjectResponse {
    nonce: String,
    vp_token: Option<VpToken>,
    presentation_submission: Option<PresentationSubmission>,
    status: Status,
}

#[derive(Deserialize)]
struct AuthrequestCreateParams {
    nonce: String,
}

/// Authorization Request Submission.
/// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-response-mode-direct_post
#[derive(Debug, Serialize, Deserialize)]
struct AuthorizationRequestSubmission {
    vp_token: VpToken,
    // presentation_submission: PresentationSubmission,
    // presentation_submission: serde_json::Value,
    presentation_submission: String,
}

/// Builds a presentation definition according to https://identity.foundation/presentation-exchange/spec/v2.0.0
fn build_presentation_definition() -> presentation_definition::PresentationDefinition {
    let presentation_definition_id = Uuid::new_v4().to_string();
    let name = "DID Key Identity Verification"; // TODO: define name
    let purpose = "Check whether your identity key has been verified."; // TODO: define purpose
                                                                        // Constraints request credentials
                                                                        // See examples: https://doc.wallet-provider.io/wallet/verifier-configuration/#full-verifier-flow-example
    let constraint_id_credential =
            // Add a constraint fields to check if the credential
            // conforms to a specific path.
            input_descriptor::ConstraintsField::new("$.credentialSubject.id".parse().unwrap())
                // Add alternative path(s) to check multiple potential formats.
                // .add_path(
                //     "$.vc.credentialSubject.id"
                //         .parse()
                //         .unwrap(),
                // )
                // .add_path(
                //     "$.vp.verifiableCredential.vc.credentialSubject.id"
                //         .parse()
                //         .unwrap(),
                // )
                // .add_path(
                //     "$.vp.verifiableCredential[0].vc.credentialSubject.id"
                //         .parse()
                //         .unwrap(),
                // )
                // .add_path("$.vp.verifiableCredential.vc.sub".parse().unwrap())
                // .add_path("$.vp.verifiableCredential[0].vc.sub".parse().unwrap())
                // .add_path("$.sub".parse().unwrap())
                // .add_path("$.iss".parse().unwrap())
                .set_name("Verify your identity".into())
                .set_purpose("Check whether your identity has been verified.".into())
                .set_filter(&serde_json::json!({
                    "type": "string",
                    "pattern": "did:(key|jwk):.*" // INFO: test if this works
                }))
                .expect("Failed to set filter, invalid validation schema.")
                // TODO: set field intent_to_retain - currently, there's no setter for this property!
                // .set_predicate(input_descriptor::Predicate::Required), // TODO: reenable this feature
                .set_predicate(input_descriptor::Predicate::Preferred);
    // let constraint_email_credential_fromjson: input_descriptor::ConstraintsField =
    //     serde_json::from_value(serde_json::json!(
    //     {
    //         // "id": "emailpass_1",
    //         "name": "Verify your email address",
    //         "porpose": "Check whether your email address has been verified.",
    //         "required": true,
    //         "retained": true,
    //         "constraints": {
    //             "fields": [
    //                 {
    //                     "path": [
    //                         "$.vc.credentialSubject.type"
    //                     ],
    //                     "filter": {
    //                         "type": "string",
    //                         "const": "EmailPass"
    //                     }
    //                 }
    //             ]
    //         }
    //     }
    //     ))
    //     .unwrap();
    // Add a constraint fields to check if the credential
    // conforms to a specific path.
    let constraint_email_credential =
        input_descriptor::ConstraintsField::new("$.vc.credentialSubject.type".parse().unwrap())
            .set_filter(&serde_json::json!({
                "type": "string",
                "const": "EmailPass"
            }))
            .expect("Failed to set filter, invalid validation schema.")
            .set_name("Verify your email address".into())
            // .set_id("emailpass".to_string()) // automatically generated
            .set_purpose("Check whether your email address has been verified.".into())
            // TODO: set field intent_to_retain - currently, there's no setter for this property!
            .set_predicate(input_descriptor::Predicate::Required);
    let constraints = input_descriptor::Constraints::new()
        // .add_constraint(constraint_id_credential)
        // .add_constraint(constraint_email_credential_fromjson)
        .add_constraint(constraint_email_credential)
        // .set_limit_disclosure(input_descriptor::ConstraintsLimitDisclosure::Required);
        .set_limit_disclosure(input_descriptor::ConstraintsLimitDisclosure::Preferred);
    let prooftype_values_supported = vec![
        ssi_data_integrity_suites::EcdsaRdfc2019::NAME.to_string(),
        // ssi_data_integrity_suites::EcdsaSd2023::NAME.to_string(),
        ssi_data_integrity_suites::EcdsaSecp256k1Signature2019::NAME.to_string(),
        ssi_data_integrity_suites::EcdsaSecp256r1Signature2019::NAME.to_string(),
        ssi_data_integrity_suites::Ed25519Signature2018::NAME.to_string(),
        ssi_data_integrity_suites::Ed25519Signature2020::NAME.to_string(),
        ssi_data_integrity_suites::EdDsa2022::NAME.to_string(),
        ssi_data_integrity_suites::EdDsaRdfc2022::NAME.to_string(),
        ssi_data_integrity_suites::EthereumEip712Signature2021::NAME.to_string(),
        ssi_data_integrity_suites::JsonWebSignature2020::NAME.to_string(),
        ssi_data_integrity_suites::RsaSignature2018::NAME.to_string(),
    ];
    let alg_values_supported = vec![
        Algorithm::ES256.to_string(),
        Algorithm::ES256K.to_string(),
        Algorithm::ES384.to_string(),
        Algorithm::EdDSA.to_string(),
        Algorithm::RS256.to_string(),
        Algorithm::RS384.to_string(),
        Algorithm::RS512.to_string(),
    ];
    let mut claim_formats_supported = credential_format::ClaimFormatMap::new();
    claim_formats_supported.insert(
        credential_format::ClaimFormatDesignation::JwtVcJson,
        credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
    );
    // claim_formats_supported.insert(
    //     credential_format::ClaimFormatDesignation::JwtVpJson,
    //     credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
    // );
    claim_formats_supported.insert(
        credential_format::ClaimFormatDesignation::JwtVc,
        credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
    );
    claim_formats_supported.insert(
        credential_format::ClaimFormatDesignation::LdpVc,
        ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
    );
    // claim_formats_supported.insert(
    //     credential_format::ClaimFormatDesignation::JwtVp,
    //     ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
    // );
    let group_id = "A";
    let mut pres_definition = presentation_definition::PresentationDefinition::new(
        presentation_definition_id,
        input_descriptor::InputDescriptor {
            id: Uuid::new_v4().to_string(),
            constraints,
            groups: vec![group_id.into()],
            ..Default::default()
        }
        .set_name(name.into())
        .set_purpose(purpose.into())
        .set_format(claim_formats_supported),
    );
    // Submission requirements are relevant for the verification of the results
    let submission_requirement = SubmissionRequirement::Pick(SubmissionRequirementPick {
        submission_requirement: SubmissionRequirementBase::From {
            from: group_id.into(),
            submission_requirement_base: SubmissionRequirementObject {
                name: Some("Submission of email credential".into()),
                purpose: Some("We need to know your email address".into()),
                property_set: None,
            },
        },
        count: Some(1),
        min: Some(1),
        max: Some(1),
    });
    let mut subission_requirements = Vec::new();
    subission_requirements.push(submission_requirement);
    let _ = pres_definition.submission_requirements_mut().insert(&mut subission_requirements);
    pres_definition
}

/// Create Authorization Request. See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-authorization-request
async fn authrequest_create(
    State(state): State<AppState>,
    params: Query<AuthrequestCreateParams>,
) -> (StatusCode, Json<AuthRequestURIResponse>) {
    let authz_request_builder = verifier::Verifier::build_authorization_request(&state.verifier);
    let pres_definition = build_presentation_definition();
    let authz_request_builder = authz_request_builder.with_presentation_definition(pres_definition);
    // TODO: initate request parameter

    let mut client_metadata = UntypedObject::default();
    let mut vp_formats = openid4vp::core::credential_format::ClaimFormatMap::new();
    let prooftype_values_supported = vec![
        ssi_data_integrity_suites::EcdsaRdfc2019::NAME.to_string(),
        // ssi_data_integrity_suites::EcdsaSd2023::NAME.to_string(),
        ssi_data_integrity_suites::EcdsaSecp256k1Signature2019::NAME.to_string(),
        ssi_data_integrity_suites::EcdsaSecp256r1Signature2019::NAME.to_string(),
        ssi_data_integrity_suites::Ed25519Signature2018::NAME.to_string(),
        ssi_data_integrity_suites::Ed25519Signature2020::NAME.to_string(),
        ssi_data_integrity_suites::EdDsa2022::NAME.to_string(),
        ssi_data_integrity_suites::EdDsaRdfc2022::NAME.to_string(),
        ssi_data_integrity_suites::EthereumEip712Signature2021::NAME.to_string(),
        ssi_data_integrity_suites::JsonWebSignature2020::NAME.to_string(),
        ssi_data_integrity_suites::RsaSignature2018::NAME.to_string(),
    ];
    let alg_values_supported = vec![
        Algorithm::ES256.to_string(),
        Algorithm::ES256K.to_string(),
        Algorithm::ES384.to_string(),
        Algorithm::EdDSA.to_string(),
        Algorithm::RS256.to_string(),
        Algorithm::RS384.to_string(),
        Algorithm::RS512.to_string(),
    ];
    vp_formats.insert(
        ClaimFormatDesignation::JwtVpJson,
        ClaimFormatPayload::AlgValuesSupported(alg_values_supported.clone()),
    );
    // vp_formats.insert(
    //     ClaimFormatDesignation::JwtVcJson,
    //     ClaimFormatPayload::AlgValuesSupported(alg_values_supported.clone()),
    // );
    vp_formats.insert(ClaimFormatDesignation::LdpVp, ClaimFormatPayload::ProofType(prooftype_values_supported.clone()));
    // vp_formats.insert(ClaimFormatDesignation::LdpVc, ClaimFormatPayload::ProofType(prooftype_values_supported.clone()));
    client_metadata.insert(VpFormats(vp_formats.clone()));
    let authz_request_builder = authz_request_builder
        .with_request_parameter(authorization_request::parameters::ResponseMode::DirectPost)
        .with_request_parameter(authorization_request::parameters::ResponseType::VpToken)
        .with_request_parameter(authorization_request::parameters::Nonce::from(params.nonce.clone()))
        .with_request_parameter(authorization_request::parameters::ClientMetadata(client_metadata));
    // TODO: create session
    // let authorization_endpoint =
    //     Url::parse(format!("https://{host}/v1/auth", host = state.config.external_hostname,).as_str()).unwrap();
    // let mut wallet_metadata = WalletMetadata::openid4vp_scheme_static();
    // let wallet_metadata: WalletMetadata = serde_json::from_value(serde_json::json!(
    //   {
    //     "authorization_endpoint": "openid4vp://",
    //     "client_id_schemes_supported": [
    //       "did"
    //     ],
    //     "request_object_signing_alg_values_supported": [
    //       "ES256"
    //     ],
    //     "response_types_supported": [
    //       "vp_token"
    //     ],
    //     "vp_formats_supported": {
    //       "jwt_vp_json": {
    //         "alg_values_supported": ["ES256"]
    //       },
    //       "jwt_vc_json": {
    //         "alg_values_supported": ["ES256"]
    //       }
    //     }
    //   }
    // ))
    // .unwrap();

    let authorization_endpoint = AuthorizationEndpoint("openid4vp://".parse().unwrap());
    let response_types_supported = ResponseTypesSupported(vec![ResponseType::VpToken]);
    let request_object_signing_alg_values_supported = RequestObjectSigningAlgValuesSupported(alg_values_supported);
    let mut object = UntypedObject::default();
    object.insert(response_types_supported);
    object.insert(request_object_signing_alg_values_supported);
    object.insert(authorization_endpoint.clone()); // BUG: Due to https://github.com/spruceid/openid4vp/issues/55 the endpoint has to be provided twice
    object.insert(VpFormatsSupported(vp_formats.clone())); // BUG: Due to https://github.com/spruceid/openid4vp/issues/55 the endpoint has to be provided twice
    let mut wallet_metadata = WalletMetadata::new(authorization_endpoint, VpFormatsSupported(vp_formats), Some(object));
    wallet_metadata.add_client_id_schemes_supported(&[ClientIdScheme::Did]).unwrap();
    // client_metadata.insert(
    //     openid4vp::core::metadata::parameters::wallet::ClientIdSchemesSupported(vec![
    //         openid4vp::core::authorization_request::parameters::ClientIdScheme::Did,
    //     ]),
    // );
    let (id, url) = authz_request_builder.build(wallet_metadata.clone()).await.unwrap();
    let mut cache = state.data_cache.lock().await;
    assert!(cache.get(&id).is_none(), "Expect authorization request to not exist");
    cache.insert(id, DataEntry { nonce: params.nonce.clone(), ..DataEntry::default() });

    // Return the session UUID and URL with 201 Created status
    (StatusCode::CREATED, Json(AuthRequestURIResponse { id, url }))
}

// Retrieves the submitted OpenID4VP data and deletes the request from the service.
async fn authrequest_get(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
) -> (StatusCode, Json<AuthRequestObjectResponse>) {
    println!("authrequest_get");
    let status = state.verifier.poll_status(request_id).await.unwrap();
    // state.session_store.remove_session(request_id).await.unwrap();
    let mut cache = state.data_cache.lock().await;
    let entry = cache.get(&request_id).unwrap().clone();
    // Cleanup, the data is only accessible once
    cache.remove(&request_id);
    // TODO: cleanup session
    (
        StatusCode::OK,
        Json(AuthRequestObjectResponse {
            nonce: entry.nonce,
            vp_token: entry.vp_token,
            presentation_submission: entry.presentation_submission,
            status,
        }),
    )
}

/// Retrieves the OpenID4VP Authorization Request and sends it to the wallet.
async fn authorize_get(State(state): State<AppState>, Path(request_id): Path<Uuid>) -> impl IntoResponse {
    println!("authorize_get {}", request_id);
    let status = state.verifier.poll_status(request_id).await.unwrap();
    assert!(
        status == Status::SentRequest || status == Status::SentRequestByReference, // FIXME: for some unknown reason, this endpoint gets called twice, not sure why
        "Authorization request status doesn't match expecation. Got: {:?}",
        status
    );
    let auth_request = state.verifier.retrieve_authorization_request(request_id).await.unwrap();
    (StatusCode::OK, [(header::CONTENT_TYPE, "application/jwt")], auth_request)
}

/// Validates the submitted presentation.
/// Follows https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-vp-token-validation
/// INFO: it looks like there's no defined behavior for when the validation fails. Therefore, we'll have to create an
/// implementation specific response.
fn validate(session: Session, response: AuthorizationResponse) -> Pin<Box<impl Future<Output = Outcome>>> {
    println!("validate");
    println!("session {:?}", serde_json::to_string(&session.presentation_definition).unwrap());
    let outcome = match response {
        AuthorizationResponse::Unencoded(data) => {
            // 1. Determine the number of VPs returned in the VP Token and identify in which VP which requested VC is
            //    included, using the Input Descriptor Mapping Object(s) in the Presentation Submission.

            // Basic verification of to ensure that definition and submission fit
            let presentation_submission = data.presentation_submission();
            if presentation_submission.id().to_string() != *session.presentation_definition.id() {
                Outcome::Failure {
                    reason: format!(
                        "Submission received for a different definition, IDs don't match: expected: {} got: {}",
                        session.presentation_definition.id(),
                        presentation_submission.id()
                    )
                    .into(),
                }
            } else {
                // session.presentation_definition.submission_requirements()
                // ignore all credentials and input descriptors that have no requirements
                println!("response, unencoded {}", serde_json::to_string(&data.presentation_submission).unwrap());

                Outcome::Error { cause: "JWT not supported".into() }
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

/// Accepts data for this Authorization Request. Data can be submitted only once!
/// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-response-mode-direct_post
async fn authorize_submit(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
    // Form(payload): Form<UnencodedAuthorizationResponse>, // FIXME: For some unknown reason, decoding fails. It works when the structure is decoded in the handler
    Form(payload): Form<AuthorizationRequestSubmission>,
) -> (StatusCode, Json<PostRedirection>) {
    println!("authorize_submit {}", request_id);
    assert!(
        state.verifier.poll_status(request_id).await.unwrap() == Status::SentRequest,
        "Authorization request status doesn't match expecation"
    );
    // TODO: update status to Status::ReceivedResponse - however, updating the status is currently not supported
    let presentation_submission: PresentationSubmission =
        serde_json::from_str(&payload.presentation_submission).unwrap();
    let new_payload = UnencodedAuthorizationResponse {
        vp_token: payload.vp_token.clone(),
        presentation_submission: presentation_submission.clone(),
    };
    let mut cache = state.data_cache.lock().await;
    let entry = cache.get(&request_id).unwrap().clone();
    cache.insert(
        request_id,
        DataEntry {
            nonce: entry.nonce.clone(),
            vp_token: Some(payload.vp_token),
            presentation_submission: Some(presentation_submission),
        },
    );
    state.verifier.verify_response(request_id, AuthorizationResponse::Unencoded(new_payload), validate).await.unwrap();
    // TODO: remove debug output
    match state.verifier.poll_status(request_id).await.unwrap() {
        Status::Complete(Outcome::Success { info }) => {
            println!("success {}", info)
        }
        Status::Complete(Outcome::Failure { reason }) => println!("failure {}", reason),
        Status::Complete(Outcome::Error { cause }) => println!("error {}", cause),
        _ => println!("unknown"),
    };
    // Redirect to target URI regardless of the result. Let the verifier take care of error handling
    let redirect_uri = Url::parse(
        format!(
            "https://{host}/{callback_base_path}/{uuid}/{nonce}",
            host = state.config.shop_hostname,
            callback_base_path = state.config.callback_base_path,
            uuid = request_id,
            nonce = entry.nonce,
        )
        .as_str(),
    )
    .unwrap();
    (StatusCode::OK, Json(PostRedirection { redirect_uri }))
}

async fn get_verifier(config: AppConfig) -> Verifier {
    // let store: OpenID4VPSessionStore = Arc::new(Mutex::new(HashMap::new()));
    let session_store = Arc::new(verifier::session::MemoryStore::default());
    let verifier_builder = Verifier::builder();
    // TODO: build request and return object
    // TODO: then, gradually move initialization elements to other parts of application

    // initate client
    let key = fs::read_to_string(config.key_path).unwrap();

    // let resolver = ssi::dids::jwk::DIDJWK.into_vm_resolver();
    // TODO: combine internal DID method resolver with the HTTP resolver as a fallback
    let resolver = dids::AnyDidMethod::default();
    let vm_resolver: dids::VerificationMethodDIDResolver<_, verification_methods::AnyMethod> =
        dids::VerificationMethodDIDResolver::new(resolver);
    // TODO: determine key type dynamically, depending on the curve and support more key types
    let signer =
        verifier::request_signer::P256Signer::new(p256::SecretKey::from_jwk_str(&key).unwrap().into()).unwrap();
    let client =
        verifier::client::DIDClient::new(config.verification_method, Arc::new(signer), vm_resolver).await.unwrap();

    let direct_post_uri =
        Url::parse(format!("https://{host}/v1/authorize", host = config.external_hostname).as_str()).unwrap();
    let verifier_builder = verifier_builder
        .with_session_store(session_store)
        .by_reference(direct_post_uri.clone()) // GET request required to retrieve session parameters - this decreases the
        // size of the QR code since just the URL needs to be encoded in the QR code!
        .with_submission_endpoint(direct_post_uri.clone()) // POST request to submit session data TODO: can this be the same as by_reference?
        .with_client(Arc::new(client));
    // TODO: initate request parameters
    // .with_default_request_parameter(t)
    verifier_builder.build().await.unwrap()
    // verifier.verify_response(reference, authorization_response, validator_function)
}

pub async fn create_app(config: AppConfig) -> Router {
    let data_cache: DataCache = Arc::new(Mutex::new(HashMap::new()));
    let verifier = get_verifier(config.clone()).await;
    let state = AppState { config, verifier:
        // Arc::new(verifier),
        verifier,
        data_cache };
    Router::new()
        .nest(
            "/v1",
            Router::new()
                // TODO: add authorization to route
                .route("/authrequests", post(authrequest_create))
                // TODO: add authorization to route
                .route("/authrequests/{requestId}", get(authrequest_get))
                .route("/authorize/{requestId}", get(authorize_get))
                .route("/authorize/{requestId}", post(authorize_submit)),
        )
        .with_state(state)
}

#[tokio::main]
async fn main() {
    let config = AppConfig::new().unwrap();

    // build our application with a single route
    let app = create_app(config.clone()).await;

    // TODO: Parse listen address properly, see https://rust-api.dev/docs/part-1/tokio-hyper-axum/#web-application-structure
    let host = if config.host.contains(':') {
        // Wrap IPv6 addresses in []
        format!("[{}]", config.host)
    } else {
        config.host
    };
    let addr = format!("{}:{}", host, config.port).parse::<SocketAddr>().expect("Failed to parse address");

    // run our app with hyper, listening globally on port 3000
    println!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
    // TODO: automatically clear open sessions after a few minutes
}

#[cfg(test)]
mod tests {
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt; // for `collect`
    use tower::ServiceExt;

    use super::*; // for `call`, `oneshot`, and `ready`

    #[tokio::test]
    async fn test_initiate_session() {
        // Create app
        let app = create_app(AppConfig {
            host: "::1".into(),
            port: 3000,
            external_hostname: "localhost".into(),
            shop_hostname: "localhost".into(),
            key_path: "./_fixtures/key.jwk".into(),
            verification_method: "did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImtYSVJicEtzTzZXZVJ1YndndWdSMWc2RGNhT3NBbmlrVXJ1WXU2QS1HVWMiLCJ5IjoiMG5WdUQ2TkhQeUFEOGF2OWdzM1h6NEoxT2c1ZEFNZDkzdTE1a0RwZklObyJ9#0".into(),
            callback_base_path: "callback".into(),
        });

        // Create test request
        let request = Request::builder()
            .method("POST")
            .uri(format!("/v1/authrequests?nonce={nonce}", nonce = Uuid::new_v4()))
            .body(Body::empty())
            .unwrap();

        // Get response
        let response = app.oneshot(request).await.unwrap();

        // Assert status code
        assert_eq!(response.status(), StatusCode::CREATED);

        // Get and parse response body
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let response: AuthRequestURIResponse = serde_json::from_slice(&body).unwrap();

        // Verify that the session_id is a valid UUID
        assert!(Uuid::parse_str(&response.id).is_ok());
    }
}
