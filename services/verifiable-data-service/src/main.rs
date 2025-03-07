// Fail build if feature is requsted, see https://www.reddit.com/r/rust/comments/8oz7md/make_cargo_fail_on_warning/
#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]

use std::{collections::HashMap, env, net::SocketAddr, sync::Arc};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use openid4vp::{
    core::{
        self, authorization_request, credential_format, input_descriptor,
        metadata::{self, WalletMetadata},
        object::{self, UntypedObject},
        presentation_definition,
    },
    verifier,
};
use serde::{Deserialize, Serialize};
use ssi::{dids, jwk::JWK, verification_methods};
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
type SessionStore = Arc<Mutex<HashMap<String, String>>>;

// Response structure
#[derive(Serialize, Deserialize)]
struct SessionResponse {
    id: String,
    url: Url,
}

// Create the session initiation handler
async fn session_create(State(store): State<SessionStore>) -> (StatusCode, Json<SessionResponse>) {
    let id = Uuid::new_v4().to_string();
    // TODO: get hostname from environment variable
    let external_hostname = "jceb-vds.theidentinet.com";
    let url = Url::parse(
        format!(
            "https://{host}/v1/sessions/{uuid}",
            host = external_hostname,
            uuid = id.as_str()
        )
        .as_str(),
    )
    .unwrap();
    let verifier_builder = verifier::Verifier::builder();
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

    let verifier_builder = verifier_builder.with_client(aclient);
    // TODO: initate session store
    let session_store = verifier::session::MemoryStore::default();
    let session_store = Arc::new(session_store);
    let verifier_builder = verifier_builder.with_session_store(session_store);
    // TODO: initate submission endpoint
    let verifier_builder = verifier_builder.with_submission_endpoint(url.clone());
    // TODO: initate request parameters
    // verifier_builder.with_default_request_parameter(t)
    let verifier = verifier_builder.build().await.unwrap();
    let authz_request_builder = verifier::Verifier::build_authorization_request(&verifier);
    // TODO: initate presentation definition
    let pd_id = "did-key-id-proof"; // TODO: make id unique
    let ipd_id = "did-key-id"; // TODO: make id unique
    let name = "DID Key Identity Verification"; // TODO: define name
    let purpose = "Check whether your identity key has been verified."; // TODO: define purpose
    let presentation_definition = presentation_definition::PresentationDefinition::new(
        pd_id.into(),
        input_descriptor::InputDescriptor::new(
            ipd_id.into(),
            input_descriptor::Constraints::new()
                .add_constraint(
                    // Add a constraint fields to check if the credential
                    // conforms to a specific path.
                    input_descriptor::ConstraintsField::new(
                        "$.credentialSubject.id".parse().unwrap(),
                    )
                    // Add alternative path(s) to check multiple potential formats.
                    .add_path(
                        "$.vp.verifiableCredential.vc.credentialSubject.id"
                            .parse()
                            .unwrap(),
                    )
                    .add_path(
                        "$.vp.verifiableCredential[0].vc.credentialSubject.id"
                            .parse()
                            .unwrap(),
                    )
                    .set_name("Verify Identity Key".into())
                    .set_purpose("Check whether your identity key has been verified.".into())
                    .set_filter(&serde_json::json!({
                        "type": "string",
                        "pattern": "did:key:.*"
                    }))
                    .expect("Failed to set filter, invalid validation schema.")
                    .set_predicate(input_descriptor::Predicate::Required),
                )
                .set_limit_disclosure(input_descriptor::ConstraintsLimitDisclosure::Required),
        )
        .set_name(name.into())
        .set_purpose(purpose.into())
        .set_format({
            let mut map = credential_format::ClaimFormatMap::new();
            map.insert(
                credential_format::ClaimFormatDesignation::JwtVcJson,
                credential_format::ClaimFormatPayload::Alg(vec![
                    ssi::crypto::Algorithm::ES256.to_string()
                ]),
            );
            map
        }),
    );
    let authz_request_builder =
        authz_request_builder.with_presentation_definition(presentation_definition);
    // TODO: initate request parameter

    let nonce = authorization_request::parameters::Nonce::from("random_nonce");
    let client_metadata = UntypedObject::default();
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
    let mut wallet_metadata = WalletMetadata::openid4vp_scheme_static();
    // let metadata = serde_json::from_value(json!(
    //   {
    //     "authorization_endpoint": "openid4vp:",
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
    //       "jwt_vc_json": {
    //         "alg_values_supported": ["ES256"]
    //       }
    //     }
    //   }
    // ))
    // .unwrap();
    //
    // let authorization_endpoint = Url::parse("openid4vp:").unwrap();
    // let mut vp_formats_supported = openid4vp::core::credential_format::ClaimFormatMap::new();
    // vp_formats_supported.insert(
    //     openid4vp::core::credential_format::ClaimFormatDesignation::JwtVpJson,
    //     openid4vp::core::credential_format::ClaimFormatPayload::Alg(vec![
    //         ssi::crypto::Algorithm::ES256.to_string(),
    //     ]),
    // );
    // vp_formats_supported.insert(
    //     openid4vp::core::credential_format::ClaimFormatDesignation::LdpVp,
    //     openid4vp::core::credential_format::ClaimFormatPayload::Alg(vec![
    //         ssi::crypto::Algorithm::ES256.to_string(),
    //     ]),
    // );
    // let mut wallet_metadata = openid4vp::core::metadata::WalletMetadata::new(
    //     openid4vp::core::metadata::parameters::wallet::AuthorizationEndpoint(
    //         authorization_endpoint,
    //     ),
    //     openid4vp::core::metadata::parameters::wallet::VpFormatsSupported(vp_formats_supported),
    //     None,
    // );
    wallet_metadata
        .add_client_id_schemes_supported(&[authorization_request::parameters::ClientIdScheme::Did])
        .unwrap();
    // client_metadata.insert(
    //     openid4vp::core::metadata::parameters::wallet::ClientIdSchemesSupported(vec![
    //         openid4vp::core::authorization_request::parameters::ClientIdScheme::Did,
    //     ]),
    // );
    let (_uuid, _url) = authz_request_builder.build(wallet_metadata).await.unwrap();
    // let request = AuthorizationRequestObject {};
    // TODO: expose poll status via uuid

    // Store the session (optional, based on your needs)
    let mut sessions = store.lock().await;
    sessions.insert(id.clone(), "TODO some session data".to_string());

    // Return the session UUID and URL with 201 Created status
    (
        StatusCode::CREATED,
        Json(SessionResponse {
            id: _uuid.into(),
            url: _url,
        }),
    )
}

// // Retrieve session status
// async fn session_status(State(store): State<SessionStore>) -> (StatusCode, Json<SessionResponse>) {
//     let id = Uuid::new_v4().to_string();
//     // Return the session ID with 201 Created status
//     (StatusCode::CREATED, Json(SessionResponse { id }))
// }

// // Retrieve session status
// async fn session_submit(State(store): State<SessionStore>) -> (StatusCode, Json<SessionResponse>) {
//     let id = Uuid::new_v4().to_string();
//     // Return the session ID with 201 Created status
//     (StatusCode::CREATED, Json(SessionResponse { id }))
// }

pub fn create_app() -> Router {
    let store: SessionStore = Arc::new(Mutex::new(HashMap::new()));
    Router::new()
        // TODO: add authorization to route
        .route("/v1/authrequests", post(authrequest_create))
        // TODO: add authorization to route
        // .route("/v1/sessions/{uuid}", get(session_status))
        // .route("/v1/sessions/{uuid}", post(session_submit))
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
        let response: SessionResponse = serde_json::from_slice(&body).unwrap();

        // Verify that the session_id is a valid UUID
        assert!(Uuid::parse_str(&response.id).is_ok());
    }
}
