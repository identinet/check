# Kubernetes Configuration

This Kubernetes configuration is meant to be used with [kustomize](https://kustomize.io/) to give you full control over
the deployed resources.

Minimum configuration via your `kustomization.yaml`:

```yaml
# Documentation: https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - https://github.com/identinet/check//services/demo-shop/k8s&ref=main

patches:
  # Set host name.
  # You also might want to add a TLS configuration.
  - target:
      kind: Ingress
    patch: |
      - op: replace
        path: /spec/rules/0/host
        value: demo-shop.example.com

secretGenerator:
  # Generate Kubernetes secret from a local environment file
  - name: demo-shop-env
    envs:
      - demo-shop.env
```

The configuration of the service is done via environment variables. Example environment file `demo-shop.env`:

```dotenv
# External hostname
EXTERNAL_HOSTNAME=demo-shop.example.com
# External hostname of the Verifiable Data Service
EXTERNAL_VDS_HOSTNAME=demo-shop.vds.example.com
# authorization token for accessing protected /authrequests endpoints
VDS_BEARER_TOKEN=testest
# External hostname of the Embedded Verification Interface
EXTERNAL_EVI_HOSTNAME=evi.example.com
# External hostname of the Verification Service Interface
EXTERNAL_VSI_HOSTNAME=check.example.com

# Variables with default values
# # Host interface that the service will bind to
# HOST=::
# # Host port that the service will bind to
# PORT=3000
```
