import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: process.env.PORT ?? 3010,
  },
  build: {
    target: "esnext",
  },
});
