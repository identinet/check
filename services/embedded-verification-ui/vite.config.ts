// Documentation: https://vite.dev/config/

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

import UnoCSS from "unocss/vite";
import presetWind4 from "@unocss/preset-wind4";
// import presetWebFonts from "@unocss/preset-web-fonts";
import { presetIcons } from "unocss";

import process from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "src");

export default defineConfig({
  plugins: [
    UnoCSS({
      // Documentation: https://unocss.dev/guide/config-file
      presets: [
        presetWind4({
          preflights: {
            reset: true,
          },
        }),
        // INFO: Doesn't work in nixos' build environment, because unocss tries to fetch the fonts during build
        // presetWebFonts({
        //   // use axios with an https proxy
        //   provider: "google",
        //   fonts: {
        //     sans: "Inter",
        //     // mono: ["Fira Code", "Fira Mono:400,700"],
        //   },
        // }),
        presetIcons({
          // Documentation: https://unocss.dev/presets/icons
          collections: {
            flowbite: () =>
              import("@iconify-json/flowbite/icons.json", {
                with: { type: "json" },
              }).then((i) => i.default),
          },
        }),
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
          identinet: {
            "50": "#E1F5FE",
            "100": "#B3E5FC",
            "200": "#81D4FA",
            "300": "#4FC3F7",
            "400": "#29B6F6",
            "500": "#03A9F4",
            "600": "#039BE5",
            "700": "#0288D1",
            "800": "#0277BD",
            "900": "#01579B",
            "950": "#172554",
          },
        },
      },
    }),
    solidPlugin(),
  ],
  server: {
    port: parseInt(process.env.PORT ?? "3015") + 1,
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
  build: {
    target: "esnext",
    manifest: true,
  },
  resolve: {
    alias: {
      "~": root, // Map ~ to ./src
    },
  },
});
