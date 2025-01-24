// Documentation: https://vite.dev/config/
import { defineConfig } from "@solidjs/start/config";
import UnoCSS from "unocss/vite";
import { presetWind } from "@unocss/preset-wind";
/**
 * TODO flowbite preset is outdated, we probably want to update the included preflight CSS results with the CSS provided
 * in the official tailwind plugin at https://github.com/themesberg/flowbite/blob/main/plugin.js
 */
import { presetFlowbite } from "@vonagam/unocss-preset-flowbite";

export default defineConfig({
  vite: {
    plugins: [UnoCSS({
      // Documentation: https://unocss.dev/guide/config-file
      presets: [
        presetWind(),
        presetFlowbite(),
      ],
      content: {
        pipeline: {
          include: [
            /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/, // copy default
            /flowbite\.js($|\?)/, // include dynamic classes from flowbite
          ],
        },
      },
    })],
    server: {
      watch: {
        ignored: [
          // speed up vite by ignoring nixos directory contents
          "**/.direnv/**",
          "**/.output/**",
        ],
      },
    },
  },
});
