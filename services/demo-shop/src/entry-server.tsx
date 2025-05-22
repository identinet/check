// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import process from "node:process";

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
            href={`https://${process.env.EXTERNAL_EVI_HOSTNAME}/evi.css`}
          />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          <div id="evi-identinet"></div>
          <script src={`https://${process.env.EXTERNAL_EVI_HOSTNAME}/evi.js`} type="module">
          </script>
          {scripts}
        </body>
      </html>
    )}
  />
));
