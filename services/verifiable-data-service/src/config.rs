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
    #[arg(
        long,
        short = 'H',
        default_value = "::1",
        help = "Server host or set via enviornment variable VDS_HOST"
    )]
    host: Option<String>,

    #[arg(
        long,
        short = 'p',
        default_value = "3000",
        help = "Server port or set via enviornment variable VDS_PORT"
    )]
    port: Option<u16>,

    #[arg(
        long,
        short = 'e',
        help = "External hostname or set via enviornment variable VDS_EXTERNAL_HOSTNAME (e.g. vds.example.com)"
    )]
    external_hostname: Option<String>,

    #[arg(
        long,
        short = 's',
        help = "Hostname of web shop or set via enviornment variable VDS_SHOP_HOSTNAME (e.g. shop.example.com)"
    )]
    shop_hostname: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub external_hostname: String,
    pub shop_hostname: String,
    // log_level: String, // TODO: add
}

impl AppConfig {
    pub fn new() -> Result<Self, ConfigError> {
        let cli = CliConfig::parse();

        let builder = Config::builder()
            .add_source(File::with_name("config").required(false)) // Read from config file (TOML, YAML, JSON)
            .add_source(Environment::with_prefix("VDS")) // Read from environment variables (e.g., APP_HOST, APP_PORT)
            .set_override_option("host", cli.host)?
            .set_override_option("port", cli.port)?
            .set_override_option("external_hostname", cli.external_hostname)?
            .set_override_option("shop_hostname", cli.shop_hostname)?;
        let config = builder.build()?.try_deserialize()?;
        Ok(config)
    }
}
