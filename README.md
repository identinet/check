# CHECK

## Development

### Setup

1. Allow direnv to install dependencies automatically: `direnv allow .`
2. Request a cloudflare tunnel configuration so services like the Verifiable
   Data Service can be developed locally while being accessible from the
   internet.
3. Store configuration in the current directory at `.cloudflared/tunnel.json`.
4. Set the tunnel user in file `.env.local`:

```dotenv
TUNNEL_USER=<your_username>
```

### Start Services

1. Start caddy reverse proxy: `just dev`
2. (Optional) Start tunnel: `just tunnel`
3. Start services, e.g. `cd ./services/demo-shop; just dev`

## Acknowledgments

![NGI TRUSTCHAIN](./docs/figures/NGI_TRUSTCHAIN.webp)

This project has received funding from the European Union's Horizon 2020
research and innovation program within the framework of the TRUSTCHAIN Project
funded under grant agreement 101093274.
