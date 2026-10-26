import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-web', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
    { name: 'phone-sized-web', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'node scripts/serve-web.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
