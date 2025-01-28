# SolidStart

Everything you need to build a Solid project, powered by
[`solid-start`](https://start.solidjs.com);

## Developing

Once you've created a project and installed dependencies with `deno install`,
start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment
to different environments.

By default, `npm run build` will generate a Node app that you can run with
`npm start`. To use a different preset, add it to the `devDependencies` in
`package.json` and specify in your `app.config.js`.

## This project was created with the [Solid CLI](https://solid-cli.netlify.app)


## Testing

```shell
just test
```

NOTE: Tests are currently broken due to some vitest <> solidjs [dependency issue](https://github.com/solidjs/solid-start/issues/1679).

You can use the solid-start example repo, install the dependencies there, and
copy the `node_modules` into the `verification-service-ui` directory.

```shell
git clone https://github.com/solidjs/solid-start.git .
cd solid-start/examples/with-vitest
npm i
cp -r node_modules path/to/verification-service-ui
```
