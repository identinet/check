use axum::{routing::get, Router};

mod controller;
mod dto;
mod service;

pub fn create_router() -> Router {
    Router::new().route("/verification", get(controller::verify_domain))
}
