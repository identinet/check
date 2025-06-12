# CHECK

## Overiew

Check provides the following 4 core services:

- ☑️ [Verification Service](./services/verification-service): Verifies the
  authenticity of a web shop or any other web site by
  [discovering](https://identity.foundation/.well-known/resources/did-configuration/)
  the [Decentralized Identifier](https://www.w3.org/TR/did-core/) and
  [retrieving](https://identity.foundation/linked-vp/) publicly linked
  [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/). Verifiable
  credentials allow any third party to determine the authenticity of the
  personal or legal identity that stands behind the visited web site.
- 🔍 [Verification Service Interface](./services/verification-service-ui):
  Visualizes the data from the Verification Service and provides an interactive
  query interface.
- ✨ [Embedded Verification Inferace](./services/embedded-verification-ui):
  Visualizes the data from the Verification Service as an trust mark that is
  embedded inside a web shop.
- 🔁 [Verifiable Data Service](./services/verifiable-data-service): Verifies the
  authenticity of ecommerce customers by
  [receiving](https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html)
  Verifiable Credentials from customer wallets and providing the verified data
  to the web shop.

## Demo Deployment

### Frontend services with user interfaces

- 🔍 [Verification Service Interface](https://check.identinet.io)
- ✨🔁 [Demo Shop](https://demo-shop.check.identinet.io): A demo web shop with a
  verifiable identity.
- ✨🔁 [Evil Demo Shop](https://evil-demo-shop.check.identinet.io): An evil demo
  web shop that tries to claim the identity of Demo Shop by referencing its
  identity.
- ✨🔁 [Evil2 Demo Shop](https://evil-demo-shop.check.identinet.io): A second
  evil demo web shop that tries to claim the identity of Demo Shop by copying
  its the credentials.

### Backend services _without_ user interfaces

- ☑️ [Verification Service](https://api.check.identinet.io)
- 🔁
  [Verifiable Data Service - Demo Shop](https://demo-shop.vds.check.identinet.io)
- 🔁
  [Verifiable Data Service - Evil Demo Shop](https://evil-demo-shop.vds.check.identinet.io)
- 🔁
  [Verifiable Data Service - Evil2 Demo Shop](https://evil2-demo-shop.vds.check.identinet.io)

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
