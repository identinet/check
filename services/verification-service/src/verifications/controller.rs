use super::dto::{
    VerificationError, VerificationRequestDto, VerificationResponse, VerificationResponseDto,
};

pub async fn verify_domain(
    _params: VerificationRequestDto,
) -> Result<VerificationResponse, VerificationError> {
    // TODO actually verify params.url #TG-143

    let json = VerificationResponseDto {
        status: "OK".to_string(),
    };
    Ok(VerificationResponse::OK(json))
}

#[cfg(test)]
mod tests {
    use crate::verifications::dto::VerificationErrorResponseDto;

    use super::*;
    use axum::{http::StatusCode, routing::get, test_helpers::TestClient, Extension, Router};

    #[tokio::test]
    async fn test_verify_domain() {
        #[derive(Clone)]
        struct Ext;

        let client = TestClient::new(
            Router::new()
                .route("/", get(verify_domain))
                .layer(Extension(Ext)),
        );

        let res = client.get("/?url=https://www.abc.com").await;
        assert_eq!(res.status(), StatusCode::OK);
        let data = res.json::<VerificationResponseDto>().await;
        assert_eq!(data.status, "OK");

        let res = client.get("/?url=").await;
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let data = res.json::<VerificationErrorResponseDto>().await;
        assert_eq!(data.error, "empty 'url' param");
    }
}
