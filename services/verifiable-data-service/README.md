# Verifiable Data Service

## Developing

`just dev`

## Building

`just build`

## OpenID4VP

[Full example](https://doc.wallet-provider.io/wallet/verifier-configuration#full-verifier-flow-example)

1. Install Talao Wallet: <https://talao.io/talao-wallet/>
2. Interact with Demo Shop and go to page that requests a credential. The
   following steps are then performed.
   - Initiate a session/an Authorization Request via Verifiable Data Service,
     `POST /api/v1/authrequests`
     - See
       [Cross Device Flow](https://openid.net/specs/openid-4-verifiable-presentations-1_0-20.html#name-cross-device-flow)
3. Display session as URL, starting with `POST openid://<VDS_URL>/api/v1/submit`
   - TODO: find out how the wallet transmits data
4. Wallet retrieves Request Object
5. Receive and verify authenticity of data on VDS
6. Forward client or ping endpoint at demo-shop
   - TODO: find out how exactly the shop is being notified
7. Retrieve data from VDS, `GET /api/v1/retrieve`
   - TODO: implement basic authentication or something similar
8. Process data in show and forward user to the next page

### Resoruces

- Talao Wallet support of OpenID4VP specs:
  <https://doc.wallet-provider.io/wallet/verifier-configuration>
- OpenID4VP draft 22, implemented by the verifiable data service:
  <https://openid.net/specs/openid-4-verifiable-presentations-1_0-22.html>
  - OpenID4VC specifications and libraries:
    <https://openid.net/sg/openid4vc/specifications/>
