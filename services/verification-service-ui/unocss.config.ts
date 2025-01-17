import { defineConfig } from "@unocss/vite";
import { presetMini } from "@unocss/preset-mini";
/**
 * TODO flowbite preset is outdated, we probably want to update the included preflight CSS results with the CSS provided
 * in the official tailwind plugin at https://github.com/themesberg/flowbite/blob/main/plugin.js
 */
import { presetFlowbite } from "@vonagam/unocss-preset-flowbite";

export default defineConfig({
  presets: [
    presetMini(),
    presetFlowbite(),
  ],
  safelist: [
    "justify-center", // required by modal
  ],
});
