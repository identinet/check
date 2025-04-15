// Documentation: https://vite.dev/config/
import { defineConfig } from "@solidjs/start/config";
import UnoCSS from "unocss/vite";
import presetWind3 from "@unocss/preset-wind3";
import { presetIcons } from "unocss";

/**
 * TODO flowbite preset is outdated, we probably want to update the included preflight CSS results with the CSS provided
 * in the official tailwind plugin at https://github.com/themesberg/flowbite/blob/main/plugin.js
 */
import { presetFlowbite } from "@vonagam/unocss-preset-flowbite";

const host = process.env.HOST || "::";
const external_hostname = process.env.EXTERNAL_HOSTNAME;
const internal_hostname = process.env.INTERNAL_HOSTNAME;
const external_api_hostname = process.env.EXTERNAL_API_HOSTNAME;
const internal_api_hostname = process.env.INTERNAL_API_HOSTNAME;
const port = parseInt(process.env.PORT || "3000");

export default defineConfig({
  vite: {
    server: {
      host,
      port,
      strictPort: true,
      allowedHosts: [
        external_hostname,
        internal_hostname,
      ],
      hmr: {
        // See https://vite.dev/config/server-options.html#server-hmr
        host: "localhost",
        protocol: "ws",
      },
      cors: {
        origin: [
          `https://${external_api_hostname}`,
          `https://${internal_api_hostname}`,
        ],
      },
      watch: {
        ignored: [
          // speed up vite by ignoring nixos directory contents
          "**/.direnv/**",
          "**/.output/**",
          "**/.vinxi/**",
          "**/.git/**",
          "**/node_modules/**",
        ],
      },
    },
    plugins: [UnoCSS({
      // Documentation: https://unocss.dev/guide/config-file
      presets: [
        presetWind3(),
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
        presetFlowbite(),
      ],
      theme: {
        colors: {
          primary: {
            50: "#EAF6FF", // card bg start
            100: "#ADDCFF", // card bg end
            200: "#64C4F3", // about section bg
            300: "#0EA5E9", // button bg check / menu hover
            400: "#039BE5", // card border
            500: "#0284C7", // button bg active / links
            600: "#1E5785", // nav bg
            700: "#1E429F", // button bg check hover
          },
          valid: {
            100: "#EAF6FF",
            500: "#ADDCFF",
            900: "#039BE5",
          },
          risky: {
            100: "#FFF7EA",
            500: "#FEEDDE",
            900: "#FFCFAD",
          },
          invalid: {
            100: "#FFEAF3",
            500: "#FFADCA",
            900: "#E5036C",
          },
        },
      },
      content: {
        pipeline: {
          include: [
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/, // copy default
            /flowbite\.js($|\?)/, // include dynamic classes from flowbite
          ],
        },
      },
    })],
  },
});
