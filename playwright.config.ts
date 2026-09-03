import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,

  /**
   * Two workers, not "one per CPU core".
   *
   * The default spawns a Chromium instance per core. These specs each drive a
   * full checkout against a hosted database, so the bottleneck is network and
   * memory rather than CPU — and on a developer laptop the default oversubscribes
   * badly enough that browsers time out while *launching*. That failure looks
   * exactly like a broken application (`page.goto` timing out, contexts failing
   * to close) and sends you hunting for a bug that is not there.
   *
   * Two is enough to halve the wall-clock time without the thrash. Override with
   * `--workers=N` when you know the machine can take it.
   */
  workers: process.env.CI ? 1 : 2,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    // A hosted database on a slow link needs more than the 5s default for the
    // first paint of a server-rendered page.
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
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

    /**
     * A cold `next build` of this app takes ~40s, but the first build after a
     * dependency change or on a cold filesystem cache can take several minutes.
     * The old 180s budget turned that into "Timed out waiting for
     * config.webServer", which reads as a server failure rather than a slow
     * build.
     */
    timeout: 420 * 1000,

    // Surface build errors instead of swallowing them into the timeout.
    stdout: 'pipe',
    stderr: 'pipe',

    env: {
      ...process.env,
      // The E2E flows complete a purchase without a live gateway, which is
      // exactly what demo mode exists for. NEXT_PUBLIC_* is inlined at build
      // time, so this must be set for the build the webServer runs.
      //
      // Note: `reuseExistingServer` means a server already running on :3000 is
      // used as-is. If you started one with `npm run start` after a normal
      // (non-demo) build, the simulated gateway will not be offered and the
      // checkout specs fail. Stop that server and let Playwright build its own.
      APP_MODE: 'demo',
      NEXT_PUBLIC_APP_MODE: 'demo',
      DEFAULT_PAYMENT_PROVIDER: 'mock',
    } as Record<string, string>,
  },
});
