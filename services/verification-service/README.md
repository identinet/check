# Verification Service

Backend service that verifies the identity of a website or DID.

## Development

### Install dependencies

```shell
just install
```

### Start development server

```shell
just dev
```

## Build application

Builds the application, not the container image:

```shell
just build
```

Builds the container image. Requires Nix/NixOS!

```shell
just docker-build
just docker-load
```

## Release

- INFO: Requires Nix/NixOS
- INFO: Requires privileged access to the github repository

### Update version number

```shell
just bump
```

### Build release

```shell
just release
```
