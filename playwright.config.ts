import { defineConfig, devices } from '@playwright/test';

// Run through `npm run test:e2e`, which starts local Supabase and sets the env.
const port = 3100;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 240_000,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    // Always build and start a fresh server, so a stale one cannot skip the model stub.
    reuseExistingServer: false,
    timeout: 600_000,
  },
});
