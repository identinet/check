# Verifiable Data Service

## Usage

[Full example](https://doc.wallet-provider.io/wallet/verifier-configuration#full-verifier-flow-example)

1. Install [Talao wallet](https://talao.io/talao-wallet/) or Impierce's UniMe
   wallet
   ([Android](https://play.google.com/store/apps/details?id=com.impierce.identity_wallet)
   or
   [iOS](https://apps.apple.com/us/app/unime-identity-wallet/id6451394321?l=vi))
2. Acquire credentials:

![Talao add Credentials](./docs/figures/talao-add-credential_small.jpg)

3. Start this service (`cd services/verifiable-data-service && just dev`) and
   the Demo Shop (start tunnel - `just tunnel`, caddy server `just dev` and shop
   `cd services/demo-shop && just dev`). Then open the Demo Shop and go to the
   page that requests a credential.

Subsequently, the following steps are performed internally:

- Initiate a session/an Authorization Request via Verifiable Data Service,
  `POST /api/v1/authrequests`
  - See
    [Cross Device Flow](https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow)
- Receive session URL and render it as a QR code.

3. Scan QR code that includes the request URL with wallet.

![Talao scan QR code](./docs/figures/talao-scan_small.jpg)

4. Wallet retrieves Request Object.
5. Verifiable Data Service receives and verifies authenticity of data.
6. Verifiable Data Service forwards client or pings endpoint at demo-shop.
   - TODO: find out how exactly the shop is being notified
7. Web shop retrieves data from Verifiable Data Service.
   - TODO: implement basic authentication or something similar
8. Process data in show and forward user to the next page.

### User Flow

![Sequence Customer Credential Sharing](../../docs/architecture/figures/sequence_customer_credential_sharing.png)

Source:
[sequence_customer_credential_sharing.mmd](../../docs/architecture/figures/sequence_customer_credential_sharing.mmd)

## Developing

`just dev`

## Building

`just build`

## OpenAPI Endpoint Specification

[openapi.yaml](./openapi.yaml)

## Resoruces

### OpenID4VP

- Talao Wallet configuration for an OpenID4VP verifier:
  <https://doc.wallet-provider.io/wallet/verifier-configuration>
- OpenID4VP draft 22, implemented by the verifiable data service:
  <https://openid.net/specs/openid-4-verifiable-presentations-1_0-22.html>
  - OpenID4VC specifications and libraries:
    <https://openid.net/sg/openid4vc/specifications/>
