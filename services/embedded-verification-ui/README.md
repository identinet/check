# Embedded Verification - User Interface

Widget that integrates the [Verification Service](../verification-service/) into
third-party websites.

## Development

### Install dependencies

```shell
just install
```

### Start development server

This server is meant to develop the UI independently, not integrated with a
third-party website:

```shell
just dev
```

Another development server can be started that serves the current version of the
UI as a widget to other services, e.g. the [demo shop](../demo-shop/):

```shell
just serve
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
