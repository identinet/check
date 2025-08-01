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
  - https://github.com/identinet/check//services/verifiable-data-service/k8s&ref=main

patches:
  # Set host name.
  # You also might want to add a TLS configuration.
  - target:
      kind: Ingress
    patch: |
      - op: replace
        path: /spec/rules/0/host
        value: shop.vds.example.com

secretGenerator:
  # Generate Kubernetes secret from a local environment file
  - name: verifiable-data-service-env
    envs:
      - verifiable-data-service.env
```

The configuration of the service is done via environment variables. Example
environment file `verifiable-data-service.env`:

```dotenv
# External hostname
EXTERNAL_HOSTNAME=demo-shop.vds.example.com
# Optional authorization token for protecting the /authrequests endpoints
# In a production setup leave this token empty place an API gateway infront of this service that performs the
# verification of request
BEARER_TOKEN=testest
# Hostname of shop and callback base path
CALLBACK_HOSTNAME=demo-shop.example.com
CALLBACK_BASE_PATH=api/sse
# Verification method for reprepresenting the shop's identifier
VERIFICATION_METHOD="did:jwk:ID#0"

# Variables with default values
# # Host interface that the service will bind to
# HOST=::
# # Host port that the service will bind to
# PORT=3000
# Path to key to that matches the verification method
# KEY_PATH=/key.jwk
```
