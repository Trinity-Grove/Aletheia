import { defineConfig, devices } from '@playwright/test';

// Shell visual-regression suite (issue #24), kept out of the default
// `playwright test` run (playwright.config.ts) so it never blocks the
// existing CI job before baseline screenshots exist for it. Once baselines
// are generated and committed (see README note in e2e-visual/), wire
// `pnpm test:e2e:visual` into CI as its own step.
export default defineConfig({
  testDir: './e2e-visual',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'shell-visual-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'shell-visual-1024',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'shell-visual-390',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
  },
});
