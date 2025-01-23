// Documentation: https://vite.dev/config/
import { defineConfig } from "@solidjs/start/config";
import UnoCSS from "unocss/vite";
import { presetWind } from "@unocss/preset-wind";

export default defineConfig({
  vite: {
    plugins: [UnoCSS({
      // Documentation: https://unocss.dev/guide/config-file
      presets: [
        presetWind(),
        // presetFlowbite(),
      ],
      safelist: [
        "justify-center", // required by modal
      ],
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
