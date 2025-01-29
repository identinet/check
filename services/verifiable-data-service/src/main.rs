// Fail build if feature is requsted, see https://www.reddit.com/r/rust/comments/8oz7md/make_cargo_fail_on_warning/
#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]

use axum::{extract::State, http::StatusCode, response::Json, routing::put, Router};
use serde::{Deserialize, Serialize};
use std::env;
use std::net::SocketAddr;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::Mutex;
use uuid::Uuid;
// use openid4vp::core::

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
}

// Create the session initiation handler
async fn initiate_session(
    State(store): State<SessionStore>,
) -> (StatusCode, Json<SessionResponse>) {
    let id = Uuid::new_v4().to_string();

    // Store the session (optional, based on your needs)
    let mut sessions = store.lock().await;
    sessions.insert(id.clone(), "TODO some session data".to_string());

    // Return the session ID with 201 Created status
    (StatusCode::CREATED, Json(SessionResponse { id }))
}

pub fn create_app() -> Router {
    let store: SessionStore = Arc::new(Mutex::new(HashMap::new()));
    Router::new().route(
        "/v1/session/initiate",
        put(initiate_session).with_state(store),
    )
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use http_body_util::BodyExt; // for `collect`
    use tower::ServiceExt; // for `call`, `oneshot`, and `ready`

    #[tokio::test]
    async fn test_initiate_session() {
        // Create app
        let app = create_app();

        // Create test request
        let request = Request::builder()
            .method("PUT")
            .uri("/v1/session/initiate")
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
