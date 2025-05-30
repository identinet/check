Our test fixtures are based on one of two identities:

- holder: issues presentations and self-issued VCs
- trust-party: issues VCs for the holder


## Generate test fixtures

```shell
./gen.sh
```

This generates two keypairs:

- `keys/key-holder.jwk`
- `keys/key-trust-party.jwk`

Based on these keys the DIDs and DID documents are created:

- `dids/did-doc-holder.json`
- `dids/did-doc-trust-party.json`
- `dids/did-holder`
- `dids/did-trust-party`

Then the script generates a bunch of credentials:

- `credentials/credential-self-issued-tampered.json`: Signed by `holder` and then modified to invalidate the proof.
- `credentials/credential-self-issued.json`: Signed by `holder`. Perfectly valid.
- `credentials/credential-trust-party-issued-expired.json`: Signed by `trust-party`. Valid proof. But expired. Made to test the expiration checks.
- `credentials/credential-trust-party-issued-for-someone-else.json`: Signed by `trust-party`. `credentialSubject.id` claim does **not** match `holder` DID. Made to test the VP.holder <-> VC.credentialSubject.id equality.
- `credentials/credential-trust-party-issued-no-expiration-date.json`: Signed by `trust-party`. Perfectly valid. No expiration date. Made to test default VC verification.
- `credentials/credential-trust-party-issued-not-expired.json`: Signed by `trust-party`. Perfectly valid. With expiration date in the future. Made to test the expiration checks.

Afterwards, presentations are issued based on these credentials:

- `presentations/presentation-multiple-vc-expired.json`: Signed by `holder`. Valid proof. One VC is expired. Made to test the nested VC validation.
- `presentations/presentation-multiple-vc.json`: Signed by `holder`. Perfectly valid. Contains multiple VCs. Made to test nested VC verification.
- `presentations/presentation-single-vc.json`: Signed by `holder`. Perfectly valid. Contains only one VC.
- `presentations/presentation-tampered-holder.json`: Signed by `holder` and then modified to invalidate the proof.
- `presentations/presentation-tampered-vc.json`: Signed by `holder`. Valid proof. Contains one invalid VC. Made to test the nested VC verification.
