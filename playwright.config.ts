import { defineConfig } from '@playwright/test';

export default defineConfig({
  // testDir: 'client/e2e',
  // testMatch: /.*\.e2e\.spec\.(ts|tsx)/,
  testDir: 'client/e2e',
  testMatch: /.*\.e2e\.spec\.ts$/,

  use: {
    baseURL: 'http://localhost:8080',   // your dev server URL
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',              // start your Vite/Next/etc
    port: 8080,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
