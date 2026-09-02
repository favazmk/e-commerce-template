import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(process.cwd());
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    env: {
      ...process.env,
      // The E2E flows complete a purchase without a live gateway, which is
      // exactly what demo mode exists for. NEXT_PUBLIC_* is inlined at build
      // time, so this must be set for the build the webServer runs.
      APP_MODE: 'demo',
      NEXT_PUBLIC_APP_MODE: 'demo',
      DEFAULT_PAYMENT_PROVIDER: 'mock',
    } as Record<string, string>,
  },
});
