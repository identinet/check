---
title: Share Credentials
description: Guide to sharing Verifiable Credentials
# sidebar:
#   order: 0
---

This guide explains how organizations can publicly share their verifiable
credentials to establish transparent identity information, enabling anyone to
anonymously and independently verify their authenticity.

## Motivation

Verifiable Credential data can be publicly shared by organizations to establish
identity information about who they are, allowing customers, partners, and other
stakeholders to anonymously and independently verify the authenticity of the
organization's identity.

CHECK's technology leverages these mechanisms and provides infrastructure
services to automate and integrate the verification into the existing web
ecosystem. By following W3C and DIF standards, organizations can create a
trustworthy digital presence that builds confidence in their online operations.

## Prerequisites

Before proceeding, ensure you have
[obtained your organization's decentralized identifier and credentials](/guides/id).

## Steps to Sharing Verifiable Credentials

Public sharing of verifiable credentials follows the
[DIF Linked Verifiable Presentation specification](https://identity.foundation/linked-vp/),
which defines how to publicly link and share credentials in a standardized,
interoperable manner.

### Option 1: Using Organizational Wallet (Recommended)

1. **Access Publishing Feature**
   - Open your organizational wallet interface
   - Navigate to the credential management section
   - Select the option to "Publish Verifiable Credentials" or "Make Credentials
     Public"

2. **Select Credentials**
   - Choose which credentials you want to make publicly available
   - Consider privacy implications and only share necessary organizational
     information

### Option 2: Manual Implementation

If your wallet does not provide an automated option to publish verifiable
credentials, follow these technical steps:

#### Step 1: Create Verifiable Presentation

1. **Issue and Sign Presentation**
   - Create a new Verifiable Presentation using your organizational wallet or
     tooling
   - Select the credentials that should be included in the public presentation
   - Sign the presentation with your organization's private key

#### Step 2: Host the Presentation

2. **Deploy to Web Server**
   - Store the signed presentation on your web server at the standard location:
   ```
   https://example-shop.com/.well-known/presentation.json
   ```
   - Ensure the file is publicly accessible via HTTPS

#### Step 3: Update DID Document

3. **Add Service Endpoint**
   - Modify your DID Document to include an additional service section pointing
     to the presentation URL:
   ```json
   {
     "service": {
       "id": "did:web:example-shop.com#presentation",
       "type": "LinkedVerifiablePresentation",
       "serviceEndpoint": [
         "https://example-shop.com/.well-known/presentation.json"
       ]
     }
   }
   ```

4. **Update Context**
   - Ensure the following URL is included in the `@context` section of your DID
     document:
   ```json
   "@context": [
     "https://www.w3.org/ns/did/v1",
     "...",
     "https://identity.foundation/linked-vp/contexts/v1"
   ]
   ```

#### Step 4: Verify Implementation

5. **Test Verification**
   - Visit [https://check.identinet.io](https://check.identinet.io)
   - Search for your identifier (e.g., `did:web:example-shop.com`)
   - Verify that your credentials are properly displayed and accessible

## Steps to Linking DNS Domain to DID

Domain linking follows the
[DIF Well Known DID Configuration specification](https://identity.foundation/.well-known/resources/did-configuration/),
establishing a bidirectional link between your domain name and decentralized
identifier.

### Step 1: Generate Domain Linkage Credential

1. Open your organizational wallet
2. Select the option to "Issue Domain Linkage Credential" or "Link Domain"
3. Enter your web shop's domain name (e.g., `example-shop.com`)
4. Generate and sign the domain linkage credential

### Step 2: Deploy Domain Configuration

1. Store the Domain Linkage credential at the standard well-known location:

```
https://example-shop.com/.well-known/did-configuration.json
```

2. Ensure the file is publicly accessible via HTTPS

### Step 3: Update DID Document Services

1. Modify your DID Document to include a LinkedDomains service:

```json
{
  "service": {
    "id": "did:web:example-shop.com#domain",
    "type": "LinkedDomains",
    "serviceEndpoint": [
      "https://example-shop.com"
    ]
  }
}
```

2. Add the domain configuration context to your DID document:

```json
"@context": [
 "https://www.w3.org/ns/did/v1",
 "...",
 "https://identity.foundation/.well-known/did-configuration/v1"
]
```

### Step 4: Verify Domain Linking

1. Visit [https://check.identinet.io](https://check.identinet.io)
2. Search for your web shop's URL (e.g., `example-shop.com`)
3. Verify that your decentralized identifier is discovered and linked
   credentials are displayed

## Best Practices

### Security Considerations

- Only publish credentials that are appropriate for public disclosure
- Regularly audit and update published credentials
- Ensure proper key management for signing presentations
- Use HTTPS for all credential endpoints

### Maintenance

- Monitor credential expiration dates and renewal requirements
- Keep DID documents synchronized with current service endpoints
- Test verification functionality regularly using the CHECK interface

### Compliance

- Follow relevant data protection regulations when publishing organizational
  information
- Ensure compliance with industry-specific requirements for credential sharing
- Document your credential publication policies for audit purposes

## Troubleshooting

### Common Issues

- **Credentials not appearing**: Verify JSON syntax and accessibility of
  well-known endpoints
- **Domain linking failures**: Check HTTPS configuration
- **DID resolution errors**: Confirm DID document syntax and context URLs

### Support Resources

- Use the CHECK verification interface to test implementations
- Review DIF specifications for detailed technical requirements
- Consult your Trust Service Provider for wallet-specific guidance

## Next Steps

Once your credentials are publicly shared and domain is linked:

- [Integrate the CHECK Trust Mark](/guides/trustmark) into your web shop
- [Set up customer verification](/guides/verification) using the Verifiable Data
  Service
