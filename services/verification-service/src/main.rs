// Fail build if feature is requsted, see https://www.reddit.com/r/rust/comments/8oz7md/make_cargo_fail_on_warning/
#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]

use axum::Router;
use std::env;
use std::net::SocketAddr;

mod verifications;

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

pub fn create_app() -> Router {
    let verifications_router = verifications::create_router();
    let v1_router = Router::new().merge(verifications_router);
    Router::new().nest("/v1", v1_router)
}

#[tokio::main]
async fn main() {
    let app = create_app();

    let (host, port) = get_config();
    let addr = format!("{}:{}", host, port)
        .parse::<SocketAddr>()
        .expect("Failed to parse address");

    println!("Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
