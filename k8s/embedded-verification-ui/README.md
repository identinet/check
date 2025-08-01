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
  - https://github.com/identinet/check//embedded-verification-ui&ref=main

patches:
  # Set host name.
  # You also might want to add a TLS configuration.
  - target:
      kind: Ingress
    patch: |
      - op: replace
        path: /spec/rules/0/host
        value: evi.example.com

configMapGenerator:
  - name: embedded-verification-ui-config
    files:
      - config.json
secretGenerator:
  # Generate Kubernetes secret from a local environment file
  - name: embedded-verification-ui-env
    envs:
      - embedded-verification-ui.env
```

The configuration of the Embedded Verification UI is done via a configuration
file. Example configuration file `config.json`:

```json
{
  "vs": "https://api.check.example.com",
  "vsi": "https://check.example.com"
}
```

The configuration of the underlaying HTTP server is done via environment
variables. Example environment file `embedded-verification-ui.env`:

```dotenv
# Documentation of available variables: https://static-web-server.net/configuration/environment-variables/
```
