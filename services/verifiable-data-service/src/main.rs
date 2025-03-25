// Fail build if feature is requsted, see https://www.reddit.com/r/rust/comments/8oz7md/make_cargo_fail_on_warning/
#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]

use std::{collections::HashMap, env, net::SocketAddr, sync::Arc};

use axum::{
    extract::{Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
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
                    AuthorizationEndpoint, RequestObjectSigningAlgValuesSupported,
                    ResponseTypesSupported, VpFormatsSupported,
                },
            },
            WalletMetadata,
        },
        object::UntypedObject,
        presentation_definition,
    },
    verifier::{self, session::SessionStore, Verifier},
};
use openid4vp_frontend::Status;
use serde::{Deserialize, Serialize};
use serde_json::json;
use ssi::{crypto::Algorithm, dids, jwk::JWK, verification_methods};
use tokio::sync::Mutex;
use url::Url;
use uuid::Uuid;

// Function to get configuration from environment variables with defaults
fn get_config() -> (String, u16) {
    let host = env::var("HOST").unwrap_or_else(|_| "::".to_string());
    let port = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let host = if host.contains(':') {
        format!("[{}]", host)
    } else {
        host
    };
    (host, port)
}

// Shared session store
// type OpenID4VPSessionStore = Arc<Mutex<HashMap<String, WalletMetadata>>>;
// TODO: swap in memory store with a postgres backend
type OpenID4VPSessionStore = Arc<verifier::session::MemoryStore>;

// Authorization Request URI Response.
// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow
#[derive(Serialize, Deserialize)]
struct AuthRequestURIResponse {
    id: String,
    url: Url,
}

// Authorization Request Object Response.
// See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow
#[derive(Serialize, Deserialize)]
struct AuthRequestObjectResponse {
    id: String,
    url: Url,
}

// Create Authorization Request. See https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-authorization-request
async fn authrequest_create(
    State(store): State<OpenID4VPSessionStore>,
) -> (StatusCode, Json<AuthRequestURIResponse>) {
    let id = Uuid::new_v4().to_string();
    // TODO: get hostname from environment variable
    let shop_hostname = "jceb-shop.theidentinet.com";
    let external_hostname = "jceb-vds.theidentinet.com";
    let url = Url::parse(
        format!(
            "https://{host}/v1/authrequests/{uuid}",
            host = external_hostname,
            uuid = id.as_str()
        )
        .as_str(),
    )
    .unwrap();
    let verifier_builder = Verifier::builder();
    // TODO: build request and return object
    // TODO: then, gradually move initialization elements to other parts of application

    // TODO: initate client
    // let vm = ssi::jwk::;
    // let signer = ssi::jwk::;
    // let resolver = ssi::dids::AnyDidMethod::default();
    // TODO: load key from the outside
    let key = include_str!("key.jwk");
    let jwk: JWK = serde_json::from_str(key)
        // let jwk: ssi::jwk::JWK = serde_json::from_value(serde_json::json!({
        //   "crv": "P-256",
        //   "kty": "EC",
        //   "x": "acbIQiuMs3i8_uszEjJ2tpTtRM4EU3yz91PH6CdH2V0",
        //   "y": "_KcyLj9vWMptnmKtm46GqDz8wf74I5LKgrl2GzH3nSE"
        // }))
        .unwrap();

    // TODO: make DID configurable
    let did = dids::jwk::DIDJWK::generate(&jwk);
    println!("did: {}", did);
    // TODO: make VM configurable
    let vm = "did:jwk:eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImtYSVJicEtzTzZXZVJ1YndndWdSMWc2RGNhT3NBbmlrVXJ1WXU2QS1HVWMiLCJ5IjoiMG5WdUQ2TkhQeUFEOGF2OWdzM1h6NEoxT2c1ZEFNZDkzdTE1a0RwZklObyJ9#0";

    // let resolver = ssi::dids::jwk::DIDJWK.into_vm_resolver();
    // TODO: combine internal DID method resolver with the HTTP resolver as a fallback
    let resolver = dids::AnyDidMethod::default();
    let vm_resolver: dids::VerificationMethodDIDResolver<_, verification_methods::AnyMethod> =
        dids::VerificationMethodDIDResolver::new(resolver);
    let signer = Arc::new(
        verifier::request_signer::P256Signer::new(
            p256::SecretKey::from_jwk_str(key)
                // p256::SecretKey::from_jwk_str(include_str!("examples/verifier.jwk"))
                .unwrap()
                .into(),
        )
        .unwrap(),
    );
    let client = verifier::client::DIDClient::new(vm.to_string(), signer.clone(), vm_resolver)
        .await
        .unwrap();
    let aclient = Arc::new(client);

    // TODO: this is the shop's redirect URL
    let redirect_uri =
        Url::parse(format!("https://{host}/checkout", host = shop_hostname).as_str()).unwrap();
    let urlref =
        Url::parse(format!("https://{host}/v1/authorize", host = external_hostname).as_str())
            .unwrap();
    // TODO: initate session store
    // let session_store = verifier::session::MemoryStore::default();
    // let session_store = Arc::new(session_store);
    let verifier_builder = verifier_builder
        .with_session_store(store)
        .by_reference(urlref.clone()) // GET request required to retrieve session parameters - this decreases the
        // size of the QR code since just the URL needs to be encoded in the QR code!
        .with_submission_endpoint(urlref.clone()) // POST request to submit session data TODO: can this be the same as by_reference?
        .with_client(aclient);
    // TODO: initate request parameters
    // .with_default_request_parameter(t)
    let verifier = verifier_builder.build().await.unwrap();

    let authz_request_builder = verifier::Verifier::build_authorization_request(&verifier);
    // TODO: initate presentation definition
    let presentation_definition_id = Uuid::new_v4().to_string();
    let ipd_id = "did-key-id"; // TODO: make id unique, not sure what the content of this is actually about
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
    let presentation_definition = presentation_definition::PresentationDefinition::new(
        presentation_definition_id,
        input_descriptor::InputDescriptor::new(ipd_id.into(), constraints)
            .set_name(name.into())
            .set_purpose(purpose.into())
            .set_format({
                let mut map = credential_format::ClaimFormatMap::new();
                map.insert(
                    credential_format::ClaimFormatDesignation::JwtVcJson,
                    credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
                );
                // map.insert(
                //     credential_format::ClaimFormatDesignation::JwtVpJson,
                //     credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
                // );
                map.insert(
                    credential_format::ClaimFormatDesignation::JwtVc,
                    credential_format::ClaimFormatPayload::Alg(alg_values_supported.clone()),
                );
                map.insert(
                    credential_format::ClaimFormatDesignation::LdpVc,
                    ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
                );
                // map.insert(
                //     credential_format::ClaimFormatDesignation::JwtVp,
                //     ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
                // );
                map
            }),
    );
    let authz_request_builder =
        authz_request_builder.with_presentation_definition(presentation_definition);
    // TODO: initate request parameter

    // TODO: Take Nonce from query parameters
    let nonce = authorization_request::parameters::Nonce::from("random_nonce");
    let mut client_metadata = UntypedObject::default();
    let mut vp_formats = openid4vp::core::credential_format::ClaimFormatMap::new();
    vp_formats.insert(
        ClaimFormatDesignation::JwtVpJson,
        ClaimFormatPayload::AlgValuesSupported(alg_values_supported.clone()),
    );
    vp_formats.insert(
        ClaimFormatDesignation::JwtVcJson,
        ClaimFormatPayload::AlgValuesSupported(alg_values_supported.clone()),
    );
    vp_formats.insert(
        ClaimFormatDesignation::LdpVp,
        ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
    );
    vp_formats.insert(
        ClaimFormatDesignation::LdpVc,
        ClaimFormatPayload::ProofType(prooftype_values_supported.clone()),
    );
    // Must not be present if response_uri is present
    // https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-response-mode-direct_post
    // client_metadata.insert(authorization_request::parameters::RedirectUri(redirect_uri));
    client_metadata.insert(VpFormats(vp_formats.clone()));
    let authz_request_builder = authz_request_builder
        .with_request_parameter(authorization_request::parameters::ResponseMode::DirectPost)
        .with_request_parameter(authorization_request::parameters::ResponseType::VpToken)
        .with_request_parameter(nonce)
        .with_request_parameter(authorization_request::parameters::ClientMetadata(
            client_metadata,
        ));
    // TODO: create session
    // let authorization_endpoint =
    //     Url::parse(format!("https://{host}/v1/auth", host = external_hostname,).as_str()).unwrap();
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
    let request_object_signing_alg_values_supported =
        RequestObjectSigningAlgValuesSupported(alg_values_supported);
    let mut object = UntypedObject::default();
    object.insert(response_types_supported);
    object.insert(request_object_signing_alg_values_supported);
    object.insert(authorization_endpoint.clone()); // BUG: Due to https://github.com/spruceid/openid4vp/issues/55 the endpoint has to be provided twice
    object.insert(VpFormatsSupported(vp_formats.clone())); // BUG: Due to https://github.com/spruceid/openid4vp/issues/55 the endpoint has to be provided twice
    let mut wallet_metadata = WalletMetadata::new(
        authorization_endpoint,
        VpFormatsSupported(vp_formats),
        Some(object),
    );
    wallet_metadata
        .add_client_id_schemes_supported(&[ClientIdScheme::Did])
        .unwrap();
    // client_metadata.insert(
    //     openid4vp::core::metadata::parameters::wallet::ClientIdSchemesSupported(vec![
    //         openid4vp::core::authorization_request::parameters::ClientIdScheme::Did,
    //     ]),
    // );
    let (_uuid, _url) = authz_request_builder
        .build(wallet_metadata.clone())
        .await
        .unwrap();
    // let request = AuthorizationRequestObject {};
    // TODO: expose poll status via uuid

    // Store the session (optional, based on your needs)
    // let mut sessions = store.lock().await;
    // sessions.insert(_uuid.into(), wallet_metadata);

    // Return the session UUID and URL with 201 Created status
    (
        StatusCode::CREATED,
        Json(AuthRequestURIResponse {
            id: _uuid.into(),
            url: _url,
        }),
    )
}

// Retrieves the submitted OpenID4VP data.
async fn authrequest_get(
    State(store): State<OpenID4VPSessionStore>,
) -> (StatusCode, Json<AuthRequestObjectResponse>) {
    println!("authrequest_get");
    let id = Uuid::new_v4().to_string();
    let external_hostname = "jceb-vds.theidentinet.com";
    let url = Url::parse(
        format!(
            "https://{host}/v1/authrequests/{uuid}",
            host = external_hostname,
            uuid = id.as_str()
        )
        .as_str(),
    )
    .unwrap();
    (
        StatusCode::CREATED,
        Json(AuthRequestObjectResponse { id: id, url: url }),
    )
}

// Retrieves the OpenID4VP Authorization Request.
async fn authorize_get(
    State(store): State<OpenID4VPSessionStore>,
    Path(request_id): Path<Uuid>,
) -> impl IntoResponse {
    // ) -> (StatusCode, std::string::String) {
    println!("authorize_get {}", request_id);
    let x = store.get_session(request_id).await.unwrap();
    println!("status {:?}", x.status);
    println!("authorization_request_jwt {}", x.authorization_request_jwt);
    println!(
        "authorization_request_object {:?}",
        x.authorization_request_object
    );
    println!("presentation_definition {:?}", x.presentation_definition);
    store
        .update_status(x.uuid, Status::SentRequest)
        .await
        .unwrap();
    // TODO: URL is only valid once.
    // return an error if request has been sent before
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/jwt")],
        x.authorization_request_jwt,
    )
}

// Accepts data for this Authorization Request.
// TODO: URL is only valid once.
async fn authorize_submit(
    State(store): State<OpenID4VPSessionStore>,
    Path(request_id): Path<Uuid>,
) -> (StatusCode, Json<AuthRequestObjectResponse>) {
    println!("authorize_submit {}", request_id);
    let id = Uuid::new_v4().to_string();
    let external_hostname = "jceb-vds.theidentinet.com";
    let url = Url::parse(
        format!(
            "https://{host}/v1/authorize/{uuid}",
            host = external_hostname,
            uuid = id.as_str()
        )
        .as_str(),
    )
    .unwrap();
    (
        StatusCode::CREATED,
        Json(AuthRequestObjectResponse { id: id, url: url }),
    )
}

// // Retrieve session status
// async fn session_status(State(store): State<OpenID4VPSessionStore>) -> (StatusCode, Json<AuthRequestURIResponse>) {
//     let id = Uuid::new_v4().to_string();
//     // Return the session ID with 201 Created status
//     (StatusCode::CREATED, Json(AuthRequestURIResponse { id }))
// }

// // Retrieve session status
// async fn session_submit(State(store): State<OpenID4VPSessionStore>) -> (StatusCode, Json<AuthRequestURIResponse>) {
//     let id = Uuid::new_v4().to_string();
//     // Return the session ID with 201 Created status
//     (StatusCode::CREATED, Json(AuthRequestURIResponse { id }))
// }

pub fn create_app() -> Router {
    // let store: OpenID4VPSessionStore = Arc::new(Mutex::new(HashMap::new()));
    let store = verifier::session::MemoryStore::default();
    let store = Arc::new(store);
    Router::new()
        // TODO: add authorization to route
        .route("/v1/authrequests", post(authrequest_create))
        // TODO: add authorization to route
        .route("/v1/authrequests/{requestId}", get(authrequest_get))
        .route("/v1/authorize/{requestId}", get(authorize_get))
        .route("/v1/authorize/{requestId}", post(authorize_submit))
        .with_state(store)
}

#[tokio::main]
async fn main() {
    // build our application with a single route
    let app = create_app();

    let (host, port) = get_config();
    let addr = format!("{}:{}", host, port)
        .parse::<SocketAddr>()
        .expect("Failed to parse address");

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
        let app = create_app();

        // Create test request
        let request = Request::builder()
            .method("POST")
            .uri("/v1/sessions")
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
