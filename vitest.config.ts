import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "vitest.setup.ts",
        "*.config.ts",
        "*.config.js",
        "dist/",
        "public/",
      ],
    },
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
