import { defineConfig, devices } from '@playwright/test';

// Real end-to-end homologation journey (issue #23): zero page.route mocks,
// runs against a real NestJS API backed by real Postgres + real MinIO
// object storage. Kept out of the default `playwright test` run
// (playwright.config.ts, which mocks every API call) because it requires
// that real infra stack to already be up — see e2e-journey/README.md for
// how to run it locally and how CI wires it.
//
// The web server itself is still started here like the other suites; what
// makes this suite "real" is that nothing in the spec intercepts network
// requests, so every request that leaves the browser actually reaches the
// API process (proxied by next.config.ts's rewrite) and the real database.
export default defineConfig({
  testDir: './e2e-journey',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
