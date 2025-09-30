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

## Demo deployment

### Frontend services with user interfaces

- 🔍 [Verification Service Interface](https://check.identinet.io)
- ✨🔁 [Demo Shop](https://demo-shop.check.identinet.io): A demo web shop with a
  verifiable identity.
- ✨🔁 [Evil Demo Shop](https://evil-demo-shop.check.identinet.io): An evil demo
  web shop tries to claim the identity of Demo Shop by referencing its identity.
  - Technical explanation: Shop has it's own
    [DID](https://evil-demo-shop.check.identinet.io/.well-known/did.json) but
    the
    [Well-Known DID Configuration](https://evil-demo-shop.check.identinet.io/.well-known/did-configuration.json)
    has been copied straight from the Demo Shop.
- ✨🔁 [Evil2 Demo Shop](https://evil2-demo-shop.check.identinet.io): A second
  evil demo web shop tries to claim the identity of Demo Shop by copying its the
  credentials.
  - Technical explanation: Shop has it's own
    [DID](https://evil2-demo-shop.check.identinet.io/.well-known/did.json) and
    the
    [Well-Known DID Configuration](https://evil2-demo-shop.check.identinet.io/.well-known/did-configuration.json)
    has been self-issued by that DID. Also the
    [Linked Verifiable Presentation](https://evil2-demo-shop.check.identinet.io/.well-known/presentation.json)
    has been self-issued by that DID, however the included credentials have been
    copied from the Demo Shop.
- ✨🔁 [Evil3 Demo Shop](https://evil3-demo-shop.check.identinet.io): A third
  evil demo web shop tries to claim the identity of Demo Shop by referencing its
  identity in a similar but different way than the first Evil Demo Shop.
  - Technical explanation: Shop has it's own
    [DID](https://evil3-demo-shop.check.identinet.io/.well-known/did.json) and
    the
    [Well-Known DID Configuration](https://evil3-demo-shop.check.identinet.io/.well-known/did-configuration.json)
    has been self-issued. However, the `credentialSubject.id` points to the Demo
    Shop's DID.

### Backend services _without_ user interfaces

- ☑️ [Verification Service](https://api.check.identinet.io)
- 🔁
  [Verifiable Data Service - Demo Shop](https://demo-shop.vds.check.identinet.io)
- 🔁
  [Verifiable Data Service - Evil Demo Shop](https://evil-demo-shop.vds.check.identinet.io)
- 🔁
  [Verifiable Data Service - Evil2 Demo Shop](https://evil2-demo-shop.vds.check.identinet.io)
- 🔁
  [Verifiable Data Service - Evil3 Demo Shop](https://evil3-demo-shop.vds.check.identinet.io)

## Development

### Setup

1. Ensure services that bind IPv6 addresses are also bound to IPv4 addresses.
   `sysctl net.ipv6.bindv6only` must return `net.ipv6.bindv6only = 0`.
   - Add `net.ipv6.bindv6only = 0` to `/etc/sysctl.conf` if a different value is
     returned.
1. Clone this repository, including submodules:
   `git clone --recurse-submodules https://github.com/identinet/check.git`
1. Install all [depedencies](#dependencies)
   - On [Nix/NixOS](https://nixos.org): direnv installs all dependencies
     automatically via: `direnv allow` directory and the service directories
     view `direnv allow`
1. Integrate [direnv](https://direnv.net/) with your shell and grant it access
   to the root directory of the repository and all
   [serivce directories](./services)
   - INFO: If you don't use Nix/NixOS, you'll receive get an error that
     `use flake` doesn't work. Direnv will still load the necessary environment
     variables. To silence the error, you can safely remove the line starting
     with `use flake` in the `.envrc` files.
1. Install a develpoment CA and register it in your browser via
   [mkcert](https://github.com/FiloSottile/mkcert)
1. (Optional) [Request](mailto:support@identinet.io) a cloudflare tunnel
   configuration so that services like the
   [Verifiable Data Service](./services/verifiable-data-service/) can be
   developed locally while being accessible from the Internet and communicate
   with mobile wallets.
   - Store the configuration in the root of the repository at
     `.cloudflared/tunnel.json`.
   - Set the tunnel user in file `.env.local`:

```dotenv
TUNNEL_USER=<your_username>
```

#### Dependencies

- (CI) [Nix](https://nixos.org)
- (CI) [Skopeo](https://github.com/containers/skopeo)
- (CI) [git-cliff](https://github.com/orhun/git-cliff)
- (CI) [Github CLI](https://cli.github.com/)
- [Caddy reverse proxy](https://caddy.com/)
- [Deno](https://deno.com/)
- [Docker](https://docker.com/)
- [Just task runnner](https://just.systems/)
- [Nodejs 22](https://nodejs.org/)
- [Nushell](https://nushell.sh/)
- [Rust toolchain](https://rust-lang.github.io/)
- [direnv environment loader](https://direnv.net/)
- [mkcert development CA](https://github.com/FiloSottile/mkcert)

### Start services

1. Start caddy reverse proxy: `just dev`
2. (Optional) Start cloudflare tunnel: `just tunnel`
3. Start services, e.g. `cd ./services/demo-shop; just dev`
4. Access services (At the start, caddy prints all available URLs)

## Acknowledgments

![NGI TRUSTCHAIN](./docs/src/assets/NGI_TRUSTCHAIN.webp)

This [project](https://identinet.io/projects/check) has received funding from
the European Union's Horizon 2020 research and innovation program within the
framework of the TRUSTCHAIN Project funded under grant agreement 101093274.
