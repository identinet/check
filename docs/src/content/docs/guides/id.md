---
title: Obtain ID
description: Guide to getting a W3C Decentralized Identifier (DID)
---

This guide explains how to set up decentralized identifiers (DIDs) and obtain
verifiable credentials for both individual users and organizations participating
in the CHECK ecosystem.

Decentralized Identifiers (DIDs) are cryptographically verifiable identifiers
that enable self-sovereign identity management. Verifiable Credentials are
tamper-evident digital documents that contain claims about an identity, issued
by trusted authorities and cryptographically secured.

## Private Individuals

Individual users need a digital wallet to store their decentralized identifier
and associated credentials when sharing verifiable data with web shops during
transactions.

### Setup Process

1. **Install a Digital Wallet**
   - Download and install a compatible wallet application such as
     [Talao](https://talao.io)
   - Complete the wallet setup and security configuration
   - Securely store your recovery phrase and backup credentials

2. **Automatic Identifier Generation**
   - Your decentralized identifier (DID) is automatically generated during
     wallet setup
   - The wallet manages the cryptographic keys associated with your DID
   - No additional registration steps are required

3. **Obtain Verifiable Credentials**
   - Request credentials from authorized issuers for various identity
     attributes:
     - **Proof of Age**: Age verification from government or certified services
     - **Proof of Phone Number**: Phone number verification from telecom
       providers
     - **Personal ID Card**: Digital version of government-issued identification
     - **Additional Credentials**: Educational certificates, professional
       licenses, or membership cards

## Organizations / Web Shops

Organizations, particularly web shops, require an organizational wallet to store
their identifier and credentials for publicly sharing their verification status
or receiving verifiable credentials from customers.

### Setup Process

1. **Establish Organizational Wallet**
   - Contact and register with a qualified Trust Service Provider (TSP)
   - Complete the organizational identity verification process
   - Set up the organizational wallet infrastructure

2. **Identifier Registration**
   - Register your organization's decentralized identifier if not automatically
     generated
   - Configure DID document with appropriate service endpoints
   - Establish cryptographic key management procedures

3. **Obtain Organizational Credentials**
   - Acquire verifiable credentials that establish your organization's
     legitimacy:
     - **Business Registration Document**: Official company registration from
       government authorities
     - **Trade Association Membership**: Certificates from relevant industry
       associations
     - **Self-Issued Documents**:
       - Company imprint and legal information
       - Return and refund policies
       - Terms of service and privacy policies
     - **Compliance Certificates**: Industry-specific certifications or
       regulatory approvals

## Next Steps

Once you have obtained your DID and verifiable credentials:

- **For Individuals**: Your wallet is ready to share credentials with
  CHECK-enabled web shops
- **For Organizations**: You can
  [share your credentials publicly](/guides/share)
