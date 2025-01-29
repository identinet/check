# Verifiable Data Service

## Developing

`just dev`

## Building

`just build`

## OpenID4VP

1. Initiate a session via ../verifiable-data-service, `PUT /api/v1/session`
2. Display session as URL, starting with `POST openid://<VDS_URL>/api/v1/submit`
   - TODO: find out how the wallet transmits data
3. Receive and verify authenticity of data on VDS
4. Forward client or ping endpoint at demo-shop
   - TODO: find out how exactly the shop is being notified
5. Retrieve data from VDS, `GET /api/v1/retrieve`
   - TODO: implement basic authentication or something similar
6. Process data in show and forward user to the next page

### Resoruces

- Talao Wallet support of OpenID4VP specs:
  <https://doc.wallet-provider.io/wallet/verifier-configuration>
- OpenID4VP draft 22, implemented by the verifiable data service:
  <https://openid.net/specs/openid-4-verifiable-presentations-1_0-22.html>
  - OpenID4VC specifications and libraries:
    <https://openid.net/sg/openid4vc/specifications/>
