import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./client/test/setupTests.ts"],
    css: true,
    globals: true,
    include: ['client/__tests__/**/*.test.{ts,tsx}'], // only unit/integration
    exclude: [
      'client/e2e/**',
      'tests/e2e/**',
      'playwright-report/**',
      'node_modules/**',
      'dist/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/client/e2e/**',           // <- exclude Playwright tests
      '**/*.e2e.spec.*',            // <- exclude by pattern too
      '**/playwright-report/**',
      '**/.playwright/**',

    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client", import.meta.url)),
    },
  },
});
