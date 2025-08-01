# Kubernetes Configuration

This Kubernetes configuration is meant to be used with
[kustomize](https://kustomize.io/) to give you full control over the deployed
resources.

Minimum configuration via your `kustomization.yaml`:

```yaml
# Documentation: https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - https://github.com/identinet/check//k8s/verification-server&ref=main

patches:
  # Set host name.
  # You also might want to add a TLS configuration.
  - target:
      kind: Ingress
    patch: |
      - op: replace
        path: /spec/rules/0/host
        value: api.check.example.com

secretGenerator:
  # Generate Kubernetes secret from a local environment file
  - name: verification-service-env
    envs:
      - verification-service.env
```

The configuration of the service is done via environment variables. Example
environment file `verification-service.env`:

```dotenv
# External hostname
EXTERNAL_HOSTNAME=api.check.example.com

# Variables with default values
# # Host interface that the service will bind to
# HOST=::
# # Host port that the service will bind to
# PORT=3000
```
