# Demo Shop

Demo shop that integrates the
[Embedded Verification UI](../embedded-verification-ui/) and the
[Verifiable Data Service](../verifiable-data-service).

## Development

### Install dependencies

```shell
just install
```

### Start development server

```bash
just dev
```

## Build application

Solid apps are built with _presets_, which optimise your project for deployment
to different environments.

By default, `just build` will generate a Node app that you can run with
`just preview`. To use a different preset, add it to the `devDependencies` in
`package.json` and specify in your `app.config.js`.

```bash
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
