import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import UnocssPlugin from "@unocss/vite";

export default defineConfig({
  plugins: [solid(), UnocssPlugin()],
});
