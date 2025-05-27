// Documentation: https://vite.dev/config/
import { defineConfig } from "@solidjs/start/config";
import UnoCSS from "unocss/vite";
import presetWind4 from "@unocss/preset-wind4";
import { presetIcons } from "unocss";

/**
 * TODO flowbite preset is outdated, we probably want to update the included preflight CSS results with the CSS provided
 * in the official tailwind plugin at https://github.com/themesberg/flowbite/blob/main/plugin.js
 */
// import { presetFlowbite } from "@vonagam/unocss-preset-flowbite";
const host = process.env.HOST || "::";
const external_hostname = process.env.EXTERNAL_HOSTNAME;
const internal_hostname = process.env.INTERNAL_HOSTNAME;
const port = parseInt(process.env.PORT || "3000");

export default defineConfig({
  vite: {
    server: {
      host,
      port,
      strictPort: true,
      allowedHosts: [
        external_hostname,
        ...(internal_hostname ? [internal_hostname] : []),
      ],
      hmr: {
        // See https://vite.dev/config/server-options.html#server-hmr
        host: "localhost",
        protocol: "ws",
      },
      cors: {
        origin: [],
      },
      watch: {
        ignored: [
          // speed up vite by ignoring nixos directory contents
          "**/.direnv/**",
          "**/.output/**",
          "**/.vinxi/**",
          "**/.vite/**",
          "**/.git/**",
          "**/node_modules/**",
          "**/dist/**",
          "**/result/**",
        ],
      },
    },
    plugins: [UnoCSS({
      // Documentation: https://unocss.dev/guide/config-file
      presets: [
        presetWind4({
          preflights: {
            reset: true,
          },
        }),
        presetIcons({
          // Documentation: https://unocss.dev/presets/icons
          collections: {
            flowbite: () =>
              import("@iconify-json/flowbite/icons.json", {
                with: { type: "json" },
              }).then((i) => i.default),
          },
          extraProperties: {
            "display": "inline-block",
            "vertical-align": "middle",
          },
        }),
        // FIXME: causes problem with unocss 66.1.2
        // presetFlowbite(),
      ],
      theme: {
        colors: {
          primary: {
            "50": "#eff6ff",
            "100": "#dbeafe",
            "200": "#bfdbfe",
            "300": "#93c5fd",
            "400": "#60a5fa",
            "500": "#3b82f6",
            "600": "#2563eb",
            "700": "#1d4ed8",
            "800": "#1e40af",
            "900": "#1e3a8a",
            "950": "#172554",
          },
        },
      },
      content: {
        pipeline: {
          include: [
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/, // copy default
            // /flowbite\.js($|\?)/, // include dynamic classes from flowbite
          ],
        },
      },
    })],
  },
});
