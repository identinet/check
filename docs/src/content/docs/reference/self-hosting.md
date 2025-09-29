---
title: Self-Hosting
description: A reference for self-hosting the CHECK system components
---

The core components of the CHECK system are available as Open Source Software
and can be fully self-hosted. Pre-built container images are published for each
component to simplify deployment.

> Refer to the [system architecture](/reference/architecture) for an overview of
> how the components interact and are designed to work together.

Each component comes with a ready-to-use Kubernetes configuration, including
documentation on how to customize deployment settings and integrate the services
into your infrastructure.

## Demo Environment

A live demo is available at
[demo-shop.check.identinet.io](https://demo-shop.check.identinet.io)

## Components

### Verification Service

Provides the backend service to verify and resolve Verifiable Credentials
published by organizations.

- [Kubernetes configuration](https://github.com/identinet/check/tree/main/services/k8s/verification-service)

### Verification Service Interface

User-facing UI to explore an organization's credentials.

- Depends on the [Verification Service](#verification-service)
- [Kubernetes configuration](https://github.com/identinet/check/tree/main/services/k8s/verification-service-ui)

### Embedded Verification Service

Lightweight widget interface to embed a trust mark into third-party websites.

- Depends on the [Verification Service](#verification-service) and references
  the [Verification Service Interface](#verification-service-interface)
- [Kubernetes configuration](https://github.com/identinet/check/tree/main/services/k8s/embedded-verification-ui)

### Verifiable Data Service

Service for verifying customer credentials and identity data during checkout or
onboarding processes.

- [Kubernetes configuration](https://github.com/identinet/check/tree/main/services/k8s/verifiable-data-service)

### Demo Web Shop

Reference integration demonstrating all components in a full user journey.

- Depends on all of the above componts
- [Kubernetes configuration](https://github.com/identinet/check/tree/main/services/k8s/demo-shop)
