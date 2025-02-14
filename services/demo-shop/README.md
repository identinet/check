# Demo Shop

Everything you need to build a Solid project, powered by
[`solid-start`](https://start.solidjs.com);

## Developing

Start a development server:

```bash
just dev
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment
to different environments.

By default, `just build` will generate a Node app that you can run with
`just preview`. To use a different preset, add it to the `devDependencies` in
`package.json` and specify in your `app.config.js`.

```bash
just build
```
