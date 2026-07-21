import { defineConfig } from '@playwright/test'

/**
 * Playwright base config — spec `versioning-test-coverage`.
 *
 * CURRENT SCOPE: the `contract-drift` project only (API-level `request` specs
 * that validate the real Version API against the yup schemas in
 * `tests/contracts/schemas`). It needs an API token, never a browser — safe to
 * run in any node CI container.
 *
 * DEFERRED (design ADR 7.4): the e2e project (journeys J1–J10 via `yarn dev`
 * webServer + storageState auth). Do NOT add e2e specs here until that phase
 * is approved.
 */
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // anti-placebo P1 also at the runner level
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  projects: [
    {
      name: 'contract-drift',
      testMatch: /tests\/contracts\/.*\.contract\.spec\.[jt]s/,
      use: {
        // Target-environment API base; provided by the scheduled/pre-deploy job.
        baseURL: process.env.CONTRACT_API_BASE_URL,
        extraHTTPHeaders: process.env.CONTRACT_API_TOKEN
          ? { Authorization: `Token ${process.env.CONTRACT_API_TOKEN}` }
          : {}
      }
    }
  ]
})
