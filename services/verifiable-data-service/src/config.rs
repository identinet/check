use clap::Parser;
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Parser)]
#[command(
    name = env!("CARGO_PKG_NAME"),         // Gets package name from Cargo.toml
    version = env!("CARGO_PKG_VERSION"),   // Gets version from Cargo.toml
    about = env!("CARGO_PKG_DESCRIPTION"), // Gets description from Cargo.toml
    long_about = concat!(env!("CARGO_PKG_DESCRIPTION"), "\n\n", "All configuration options can either be specified via command line argument, environment variable or configuration file (config.yaml | config.toml | config.json).")
)]
struct CliConfig {
    #[arg(long, short = 'H', help = "Server host or set via environment variable HOST (default: ::)")]
    host: Option<String>,

    #[arg(long, short = 'p', help = "Server port or set via environment variable PORT (default: 3000)")]
    port: Option<u16>,

    #[arg(
        long,
        short = 'e',
        help = "External hostname or set via environment variable EXTERNAL_HOSTNAME (e.g. demo-shop.vds.example.com)"
    )]
    external_hostname: Option<String>,

    #[arg(
        long,
        short = 's',
        help = "Callback hostname of external service or set via environment variable CALLBACK_HOSTNAME (e.g. demo-shop.example.com)"
    )]
    callback_hostname: Option<String>,

    #[arg(
        long,
        short = 'c',
        help = "Callback base path of web shop for successful data submissions or set via environment variable CALLBACK_BASE_PATH (default: callback, e.g. callback → https://shop.example.com/callback/<request_id>)"
    )]
    callback_base_path: Option<String>,

    #[arg(
        long,
        short = 'k',
        help = "Path to private key in JWK format or set via environment variable KEY_PATH (e.g. ./key.jwk)"
    )]
    key_path: Option<String>,

    #[arg(
        long,
        short = 'v',
        help = "Verification method, DID + key referefence, or set via environment variable VERIFICATION_METHOD (e.g. did:web:shop.example.com#key1)"
    )]
    verification_method: Option<String>,

    #[arg(
        long,
        short = 't',
        help = "Optional access token to protect access to the authorizoation request creation and data retrieval, or set via environment variable BEARER_TOKEN (e.g. 5exmFqoMMkT7Ol4wQCUuLju4jepmd5GHWFITNSn4). In a production environment, use an external Identity and Accuss Management system and API gateway."
    )]
    bearer_token: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub external_hostname: String,
    pub callback_hostname: String,
    pub key_path: String,
    pub verification_method: String,
    pub callback_base_path: String,
    pub bearer_token: Option<String>,
    // log_level: String, // TODO: add
}

impl AppConfig {
    pub fn new() -> Result<Self, ConfigError> {
        let cli = CliConfig::parse();

        let builder = Config::builder()
            .add_source(File::with_name("config").required(false)) // Read from config file (TOML, YAML, JSON)
            // .add_source(Environment::with_prefix("VDS")) // Read from environment variables (e.g., APP_HOST, APP_PORT)
            .add_source(Environment::default()) // Read from environment variables (e.g., APP_HOST, APP_PORT)
            .set_default("host", "::")?
            .set_default("port", "3000")?
            .set_default("callback_base_path", "callback")?
            .set_override_option("host", cli.host)?
            .set_override_option("port", cli.port)?
            .set_override_option("external_hostname", cli.external_hostname)?
            .set_override_option("callback_hostname", cli.callback_hostname)?
            .set_override_option("key_path", cli.key_path)?
            .set_override_option("verification_method", cli.verification_method)?
            .set_override_option("callback_base_path", cli.callback_base_path)?
            .set_override_option("bearer_token", cli.bearer_token)?;
        let config: AppConfig = builder.build()?.try_deserialize()?;
        Self::validate(config)
    }
    pub fn validate(config: Self) -> Result<Self, ConfigError> {
        if config.host.is_empty() {
            return Err(ConfigError::NotFound("Error: 'host' is required but missing".into()));
        }
        if config.port == 0 {
            return Err(ConfigError::NotFound("Error: 'port' out of bounds".into()));
        }
        if config.external_hostname.is_empty() {
            return Err(ConfigError::NotFound("Error: 'external_hostname' is required but missing".into()));
        }
        if config.callback_hostname.is_empty() {
            return Err(ConfigError::NotFound("Error: 'shop_hostname' must be a valid non-zero value".into()));
        }
        if config.key_path.is_empty() {
            return Err(ConfigError::NotFound("Error: 'key_path' is required but missing".into()));
        }
        if config.verification_method.is_empty() {
            return Err(ConfigError::NotFound("Error: 'verification_method' is required but missing".into()));
        }
        if config.callback_base_path.is_empty() {
            return Err(ConfigError::NotFound("Error: 'callback_base_path' is required but missing".into()));
        }

        Ok(config)
    }
}
