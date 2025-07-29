#!/usr/bin/env -S bash
# Exit if any command in the script fails.
set -e
set -x

# Allow issuing using a DID method other than did:jwk
did_method=${DID_METHOD:-jwk}

# Allow setting proof format using environmental variables.
proof_format=${PROOF_FORMAT:-ldp}
vc_proof_format=${VC_PROOF_FORMAT:-$proof_format}
vp_proof_format=${VP_PROOF_FORMAT:-$proof_format}

# Note that type must match key material
# Sample types, set to "asdf" to get a list of all possible values:
# RsaSignature2018, Ed25519Signature2018, Ed25519Signature2020, DataIntegrityProof,
# EcdsaSecp256k1Signature2019, EcdsaSecp256k1RecoverySignature2020, Eip712Signature2021,
# JsonWebSignature2020, EcdsaSecp256r1Signature2019, CLSignature2019
proof_type=${PROOF_TYPE:-JsonWebSignature2020}
vc_proof_type=${VC_PROOF_TYPE:-$proof_type}
vp_proof_type=${VP_PROOF_TYPE:-$proof_type}

# Pretty-print JSON using jq or json_pp if available.
print_json() {
    file=${1?file}
    if command -v jq >/dev/null 2>&1; then
        jq . "$file" || cat "$file"
    elif command -v json_pp >/dev/null 2>&1; then
        json_pp < "$file" || cat "$file"
    else
        cat "$file"
    fi
}

# didkit wrapper
didkit_docker() {
    didkit "${@}"
    # docker run -i --rm -v ./:/tmp/:z -w /tmp identinet/didkit-cli:0.3.2-10 "$@"
}

dirs="credentials dids keys presentations did-configurations"
for dir in $dirs; do
    if [ ! -d "$dir" ]; then
        mkdir "$dir"
    fi
done

# Create ed25119 keypairs if needed.
echo '### KEYS ###'
if [ -e keys/key-holder.jwk ]; then
    echo 'Using existing holder keypair.'
else
    didkit_docker generate-ed25519-key > keys/key-holder.jwk
    echo 'Generated new holder keypair.'
fi

if [ -e keys/key-trust-party.jwk ]; then
    echo 'Using existing trust party keypair.'
else
    didkit_docker generate-ed25519-key > keys/key-trust-party.jwk
    echo 'Generated new trust-party keypair.'
fi
echo

# Get the keypair's DID.
holder_did=$(didkit_docker key-to-did "$did_method" -k keys/key-holder.jwk)
tp_did=$(didkit_docker key-to-did "$did_method" -k keys/key-trust-party.jwk)
echo '### DID ###'
printf 'holder: %s\n' "$holder_did"
printf 'trust-party: %s\n' "$tp_did"
echo
echo "$holder_did" > dids/did-holder
echo "$tp_did" > dids/did-trust-party

echo '### DID document ###'
didkit_docker did-resolve "$holder_did" | tee dids/did-doc-holder.json
didkit_docker did-resolve "$tp_did" | tee dids/did-doc-trust-party.json
echo

# Get verificationMethod for keypair.
# This is used to identify the key in linked data proofs.
verification_method_holder=$(didkit_docker key-to-verification-method "$did_method" -k keys/key-holder.jwk)
verification_method_tp=$(didkit_docker key-to-verification-method "$did_method" -k keys/key-trust-party.jwk)
echo '### Verification method ###'
printf 'holder: %s\n' "$verification_method_holder"
printf 'trust-party: %s\n' "$verification_method_tp"
echo

_issue_and_encode() {
    vc_or_vp=$1
    file=$2
    file_signed="${file}-signed"
    file_encoded="${file}.json"
    key_file=$3
    verification_method=$4
    proof_format=$5
    proof_type=$6

    # Issue the verifiable credential.
    # Ask didkit to issue a verifiable credential using the given keypair file,
    # verification method, and proof purpose, passing the unsigned credential on
    # standard input. DIDKit creates a linked data proof to add to the credential,
    # and outputs the resulting newly-issued verifiable credential on standard
    # output, which we save to a file.
    didkit_docker "vc-issue-$vc_or_vp" \
             -k "$key_file" \
             -v "$verification_method" \
             -p assertionMethod \
             -f "$proof_format" \
             -t "$proof_type" \
             < "$file" > "$file_signed"

    # Encode credential as JSON for presenting.
    printf '### Verifiable %s ###\n' "$vc_or_vp"
    if [ "$proof_format" == jwt ]; then
        echo -n '"'
        cat "$file_signed"
        echo -n '"'
    else
        print_json "$file_signed"
    fi | tee "$file_encoded"
    echo
}
issue_and_encode_vc() {
    _issue_and_encode "credential" "$@" "$vc_proof_format" "$vc_proof_type"
}
issue_and_encode_vp() {
    _issue_and_encode "presentation" "$@" "$vp_proof_format" "$vp_proof_type"
}

# Issue credentials.
vc_issuance_date=$(date --utc +%FT%TZ)
vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "$holder_did"
    }
}
EOF
issue_and_encode_vc credentials/credential-self-issued keys/key-holder.jwk "$verification_method_holder"

vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued-no-id <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {}
}
EOF
issue_and_encode_vc credentials/credential-self-issued-no-id keys/key-holder.jwk "$verification_method_holder"

cat credentials/credential-self-issued.json \
    | jq '.credentialSubject.id |= "did:example:foobar"' \
    > credentials/credential-self-issued-tampered.json

vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-trust-party-issued-no-expiration-date <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$tp_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "$holder_did"
    }
}
EOF
issue_and_encode_vc credentials/credential-trust-party-issued-no-expiration-date keys/key-trust-party.jwk "$verification_method_tp"

vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-trust-party-issued-for-someone-else <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$tp_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "did:example:d23dd687a7dc6787646f2eb98d1"
    }
}
EOF
issue_and_encode_vc credentials/credential-trust-party-issued-for-someone-else keys/key-trust-party.jwk "$verification_method_tp"

vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-trust-party-issued-not-expired <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$tp_did",
    "issuanceDate": "$vc_issuance_date",
    "expirationDate": "2999-01-01T01:00:00Z",
    "credentialSubject": {
        "id": "$holder_did"
    }
}
EOF
issue_and_encode_vc credentials/credential-trust-party-issued-not-expired keys/key-trust-party.jwk "$verification_method_tp"

vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-trust-party-issued-expired <<EOF
{
    "@context": "https://www.w3.org/2018/credentials/v1",
    "id": "$vc_id",
    "type": ["VerifiableCredential"],
    "issuer": "$tp_did",
    "issuanceDate": "$vc_issuance_date",
    "expirationDate": "2000-12-31T23:59:00Z",
    "credentialSubject": {
        "id": "$holder_did"
    }
}
EOF
issue_and_encode_vc credentials/credential-trust-party-issued-expired keys/key-trust-party.jwk "$verification_method_tp"


# Create presentation embedding verifiable credential(s).
# Prepare to present the verifiable credential by wrapping it in a
# Verifiable Presentation. The id here is a random UUID.
vp_id="urn:uuid:"$(uuidgen)
cat > presentations/presentation-single-vc <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "$vp_id",
    "type": ["VerifiablePresentation"],
    "holder": "$holder_did",
    "verifiableCredential": $(cat credentials/credential-self-issued.json)
}
EOF
issue_and_encode_vp presentations/presentation-single-vc keys/key-holder.jwk "$verification_method_holder"

cat presentations/presentation-single-vc.json \
    | jq '.holder |= "did:example:foobar"' \
    > presentations/presentation-tampered-holder.json

vp_id="urn:uuid:"$(uuidgen)
cat > presentations/presentation-tampered-vc <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "$vp_id",
    "type": ["VerifiablePresentation"],
    "holder": "$holder_did",
    "verifiableCredential": $(cat credentials/credential-self-issued-tampered.json)
}
EOF
issue_and_encode_vp presentations/presentation-tampered-vc keys/key-holder.jwk "$verification_method_holder"

vp_id="urn:uuid:"$(uuidgen)
cat > presentations/presentation-multiple-vc <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "$vp_id",
    "type": ["VerifiablePresentation"],
    "holder": "$holder_did",
    "verifiableCredential": [$(cat credentials/credential-self-issued.json), $(cat credentials/credential-trust-party-issued-no-expiration-date.json), $(cat credentials/credential-trust-party-issued-not-expired.json)]
}
EOF
issue_and_encode_vp presentations/presentation-multiple-vc keys/key-holder.jwk "$verification_method_holder"

vp_id="urn:uuid:"$(uuidgen)
cat > presentations/presentation-multiple-vc-expired <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "$vp_id",
    "type": ["VerifiablePresentation"],
    "holder": "$holder_did",
    "verifiableCredential": [$(cat credentials/credential-self-issued.json), $(cat credentials/credential-trust-party-issued-expired.json)]
}
EOF
issue_and_encode_vp presentations/presentation-multiple-vc-expired keys/key-holder.jwk "$verification_method_holder"

vp_id="urn:uuid:"$(uuidgen)
cat > presentations/presentation-multiple-vc-bad-subject-id <<EOF
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "$vp_id",
    "type": ["VerifiablePresentation"],
    "holder": "$holder_did",
    "verifiableCredential": [$(cat credentials/credential-self-issued.json), $(cat credentials/credential-trust-party-issued-for-someone-else.json)]
}
EOF
issue_and_encode_vp presentations/presentation-multiple-vc-expired keys/key-holder.jwk "$verification_method_holder"


# Create DID Configurations
echo '### DID configuration ###'
vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued-domain-linkage <<EOF
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/did-configuration/v1"
    ],
    "id": "$vc_id",
    "type": ["VerifiableCredential", "DomainLinkageCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "$holder_did",
        "origin": "https://example.com"
    }
}
EOF
# issue_and_encode_vc credentials/credential-self-issued-domain-linkage keys/key-holder.jwk $verification_method_holder
# NOTE does not work with didkit docker
# manually sign the VC like
# didkit credential issue -k ../check/services/verification-service/tests/keys/key-holder.jwk -v $verification_method -p assertionMethod -f ldp -t JsonWebSignature2020 < ../check/services/verification-service/tests/credentials/credential-self-issued-domain-linkage-fake-origin > ../check/services/verification-service/tests/credentials/credential-self-issued-domain-linkage-fake-origin.json

domain_linkage_vc=$(cat credentials/credential-self-issued-domain-linkage.json)
cat > did-configurations/did-config-holder <<EOF
{
    "@context": "https://identity.foundation/.well-known/did-configuration/v1",
    "linked_dids": [$domain_linkage_vc]
}
EOF
print_json did-configurations/did-config-holder | tee did-configurations/did-config-holder.json


vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued-domain-linkage-bad-subject-id <<EOF
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/did-configuration/v1"
    ],
    "id": "$vc_id",
    "type": ["VerifiableCredential", "DomainLinkageCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "https://example.com",
        "origin": "https://example.com"
    }
}
EOF
# issue_and_encode_vc credentials/credential-self-issued-domain-linkage keys/key-holder.jwk $verification_method_holder

domain_linkage_vc=$(cat credentials/credential-self-issued-domain-linkage-bad-subject-id.json)
cat > did-configurations/did-config-holder-bad-subject-id <<EOF
{
    "@context": "https://identity.foundation/.well-known/did-configuration/v1",
    "linked_dids": [$domain_linkage_vc]
}
EOF
print_json did-configurations/did-config-holder-bad-subject-id | tee did-configurations/did-config-holder-bad-subject-id.json


vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued-domain-linkage-fake-origin <<EOF
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/did-configuration/v1"
    ],
    "id": "$vc_id",
    "type": ["VerifiableCredential", "DomainLinkageCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "$holder_did",
        "origin": "https://fake.com"
    }
}
EOF
# issue_and_encode_vc credentials/credential-self-issued-domain-linkage keys/key-holder.jwk $verification_method_holder

domain_linkage_vc=$(cat credentials/credential-self-issued-domain-linkage-fake-origin.json)
cat > did-configurations/did-config-holder-fake-origin <<EOF
{
    "@context": "https://identity.foundation/.well-known/did-configuration/v1",
    "linked_dids": [$domain_linkage_vc]
}
EOF
print_json did-configurations/did-config-holder-fake-origin | tee did-configurations/did-config-holder-fake-origin.json


vc_id="urn:uuid:$(uuidgen)"
cat > credentials/credential-self-issued-domain-linkage-subject-is-not-issuer <<EOF
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/did-configuration/v1"
    ],
    "id": "$vc_id",
    "type": ["VerifiableCredential", "DomainLinkageCredential"],
    "issuer": "$holder_did",
    "issuanceDate": "$vc_issuance_date",
    "credentialSubject": {
        "id": "did:example:foo",
        "origin": "https://example.com"
    }
}
EOF
# issue_and_encode_vc credentials/credential-self-issued-domain-linkage keys/key-holder.jwk $verification_method_holder

domain_linkage_vc=$(cat credentials/credential-self-issued-domain-linkage-subject-is-not-issuer.json)
cat > did-configurations/did-config-holder-subject-is-not-issuer <<EOF
{
    "@context": "https://identity.foundation/.well-known/did-configuration/v1",
    "linked_dids": [$domain_linkage_vc]
}
EOF
print_json did-configurations/did-config-holder-subject-is-not-issuer | tee did-configurations/did-config-holder-subject-is-not-issuer.json


# clean up.
find credentials/ -type f -not -name *.json -delete
find presentations/ -type f -not -name *.json -delete
find did-configurations/ -type f -not -name *.json -delete
