use axum::{routing::get, Router};
use std::env;
use std::net::SocketAddr;

// Function to get configuration from environment variables with defaults
fn get_config() -> (String, u16) {
    let host = env::var("VDS_HOST").unwrap_or_else(|_| "::".to_string());
    let port = env::var("VDS_PORT")
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
    Router::new().route("/", get(|| async { "Hello, World!" }))
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
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use http_body_util::BodyExt; // for `collect`
    use tower::ServiceExt; // for `call`, `oneshot`, and `ready`

    #[tokio::test]
    async fn test_hello_world() {
        // Create app for testing
        let app = create_app();
        // Create test request
        let request = Request::builder().uri("/").body(Body::empty()).unwrap();

        // Simulate request and get response
        let response = app.oneshot(request).await.unwrap();

        // Assert status code
        assert_eq!(response.status(), StatusCode::OK);

        // Convert bytes to string and assert content
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert_eq!(&body[..], b"Hello, World!");
    }
}
