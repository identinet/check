use super::dto::{
    VerificationError, VerificationRequestDto, VerificationResponse, VerificationResponseDto,
};

pub async fn verify_domain(
    params: VerificationRequestDto,
) -> Result<VerificationResponse, VerificationError> {
    println!("{}", params.domain);

    let json = VerificationResponseDto {
        status: "OK".to_string(),
    };
    Ok(VerificationResponse::OK(json))
}
