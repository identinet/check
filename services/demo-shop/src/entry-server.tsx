// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {/* <link rel="stylesheet" href="https://evi.identinet.io.localhost/evi.css" /> */}
          <link
            rel="stylesheet"
            href="https://evi.check.identinet.io/evi.css"
          />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          <div id="evi-identinet"></div>
          {/* <script src="https://evi.identinet.io.localhost/evi.js" type="module"> */}
          <script src="https://evi.check.identinet.io/evi.js" type="module">
          </script>
          {scripts}
        </body>
      </html>
    )}
  />
));
