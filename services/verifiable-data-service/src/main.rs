use axum::{routing::get, Router};
use std::env;
use std::net::SocketAddr;

// Function to get configuration from environment variables with defaults
fn get_config() -> (String, u16) {
    let host = env::var("VDS_HOST").unwrap_or_else(|_| "[::]".to_string());
    let port = env::var("VDS_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    (host, port)
}

#[tokio::main]
async fn main() {
    // build our application with a single route
    let app = Router::new().route("/", get(|| async { "Hello, World!" }));

    let (host, port) = get_config();
    let addr = format!("{}:{}", host, port)
        .parse::<SocketAddr>()
        .expect("Failed to parse address");

    // run our app with hyper, listening globally on port 3000
    println!("Server starting on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
