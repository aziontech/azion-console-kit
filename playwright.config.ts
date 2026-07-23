import { defineConfig } from '@playwright/test'

/**
 * Playwright base config — spec `versioning-test-coverage`.
 *
 * CURRENT SCOPE: the `contract-drift` project only (API-level `request` specs
 * that validate the PUBLISHED OpenAPI spec of a target environment against the
 * yup schemas in `tests/contracts/schemas`). It fetches one OPEN documentation
 * URL (`OPENAPI_SCHEMA_URL`) — no token, no browser — safe in any node CI
 * container. The spec uses the full URL from the env, so no `baseURL`/auth
 * header wiring is needed here.
 *
 * DEFERRED (design ADR 7.4): the e2e project (journeys J1–J10 via `yarn dev`
 * webServer + storageState auth). Do NOT add e2e specs here until that phase
 * is approved.
 */
export default defineConfig({
  testDir: 'tests',
  // Serial on purpose: the whole drift suite takes ~3s, and the known-drift
  // staleness test aggregates the matches of EVERY resource test in module
  // state — parallel workers would each see only their own slice.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI, // anti-placebo P1 also at the runner level
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  projects: [
    {
      name: 'contract-drift',
      testMatch: /tests\/contracts\/.*\.contract\.spec\.[jt]s/
    }
  ]
})
