# Verification Service - User Interface

## Development

### Install

```shell
just install
```

### Run

```shell
just dev
```

### Testing

```shell
just test
```

NOTE: Tests are currently broken due to some vitest <> solidjs
[dependency issue](https://github.com/solidjs/solid-start/issues/1679).

You can use the solid-start example repo, install the dependencies there, and
copy the `node_modules` into the `verification-service-ui` directory.

```shell
git clone https://github.com/solidjs/solid-start.git .
cd solid-start/examples/with-vitest
npm i
cp -r node_modules path/to/verification-service-ui
```
