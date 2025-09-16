import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./client/test/setupTests.ts"],
    css: true,
    globals: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client", import.meta.url)),
    },
  },
});
