import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
  server: {
    watch: {
      ignored: [
        // speed up vite by ignoring nixos directory contents
        "**/.direnv/**",
        "**/.output/**",
      ],
    },
  },
});
