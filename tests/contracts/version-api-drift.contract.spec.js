/* eslint-env node */
/**
 * Contract DRIFT check — spec `versioning-test-coverage`, task 8.1 (req 10.4).
 *
 * PURPOSE (deploy safety): validate the REAL Version API of a target
 * environment against the yup schemas the front's adapters assume
 * (`tests/contracts/schemas/**`, single source of truth via `contractSchemas`).
 * Runs API-only (Playwright `request` — no browser) so it is safe in any node
 * CI container. Intended to run scheduled AND as a pre-deploy gate that BLOCKS
 * the deploy when the API diverges from what the adapters read.
 *
 * SCOPE (this first version):
 *   - READ-ONLY. Only GETs. No POST/PUT/PATCH/DELETE: read drift already catches
 *     a contract change, and mutating a real environment is unsafe. Mutation
 *     drift is deferred to when a dedicated seeded tenant exists.
 *   - Workspace-API deployable resources only: application, workload,
 *     custom_page, firewall, connector, function, network_list, waf.
 *   - Deployment is intentionally EXCLUDED here: it lives under a different
 *     base URL (`/deployment-api`, not the workspace `v4/...` baseURL wired in
 *     `playwright.config.ts`). It is NOT marked `test.fixme` on purpose — our
 *     testing bar forbids committed escape hatches (`.skip`/`.only`/`fixme`);
 *     it will get its own spec/base-URL wiring in a later task.
 *
 * SKIP SEMANTICS (both are runtime-conditional, NOT the static committed skips
 * the bar rejects):
 *   - Config guard: if `CONTRACT_API_BASE_URL` is unset the whole file skips
 *     cleanly, so a job without the env passes instead of failing.
 *   - Per-resource: if the target env has no rows for a resource (empty list),
 *     or the caller lacks access (403/404), that resource's test skips at
 *     runtime with a reason. This is data-driven, not a disabled test.
 *
 * STRUCTURED LOGS: the repo lint bans `console.*` except `console.error`, so
 * instead of logging we attach one JSON annotation per validated endpoint
 * ({resource, endpoint, status, items, ok}) — visible in the Playwright report,
 * zero lint noise.
 *
 * HOW TO RUN against a target environment:
 *   CONTRACT_API_BASE_URL=https://api.azion.com \
 *   CONTRACT_API_TOKEN=<workspace-token> \
 *   npx playwright test --project=contract-drift
 * Without env it exits 0 with every test skipped (validation path for CI wiring).
 */
import { test, expect } from '@playwright/test'
import { contractSchemas } from './schemas'
import { resolveVersionId } from './schemas/version-common.schema'

// Skip the whole file cleanly when the target env is not configured.
test.skip(!process.env.CONTRACT_API_BASE_URL, 'CONTRACT_API_BASE_URL not set')

const REQUEST_TIMEOUT_MS = 20000
const TEST_TIMEOUT_MS = 45000

// Statuses that mean "this resource is not reachable/authorized in the target
// env" — a data/access condition, not contract drift → skip, don't fail.
const NOT_AVAILABLE_STATUSES = [403, 404]

/**
 * Workspace deployable resources under the shared `v4/workspace` baseURL.
 * `schema` is the resource's version-response contract from the single-source
 * registry; `path` is the parent-resource collection endpoint.
 */
const RESOURCES = [
  { resource: 'application', path: '/v4/workspace/applications', schema: contractSchemas.application.versionResponse },
  { resource: 'workload', path: '/v4/workspace/workloads', schema: contractSchemas.workload.versionResponse },
  { resource: 'custom_page', path: '/v4/workspace/custom_pages', schema: contractSchemas.customPage.versionResponse },
  { resource: 'firewall', path: '/v4/workspace/firewalls', schema: contractSchemas.edgeFirewall.versionResponse },
  { resource: 'connector', path: '/v4/workspace/connectors', schema: contractSchemas.edgeConnector.versionResponse },
  { resource: 'function', path: '/v4/workspace/functions', schema: contractSchemas.edgeFunction.versionResponse },
  { resource: 'network_list', path: '/v4/workspace/network_lists', schema: contractSchemas.networkList.versionResponse },
  { resource: 'waf', path: '/v4/workspace/wafs', schema: contractSchemas.waf.versionResponse }
]

/**
 * Unwraps a list payload the same way the base adapter does
 * (`raw?.data ?? raw`, then `.results` or a bare array), so the drift check
 * reads exactly what the front reads.
 */
const extractResults = (body) => {
  const source = body?.data ?? body
  if (Array.isArray(source?.results)) return source.results
  if (Array.isArray(source)) return source
  return []
}

/** Unwraps a single-object payload with the adapter's precedence. */
const unwrapItem = (body) => body?.data ?? body

/**
 * Validates one raw API item against the contract schema, returning ALL
 * messages (abortEarly:false) so a drift report lists every broken field at
 * once. `strict` disables coercion — we assert the API's real types.
 */
const collectErrors = (schema, item) => {
  try {
    schema.validateSync(item, { strict: true, abortEarly: false })
    return []
  } catch (err) {
    return err?.errors?.length ? err.errors : [err?.message ?? String(err)]
  }
}

/** One structured JSON annotation per validated endpoint (see header). */
const annotate = (testInfo, entry) => {
  testInfo.annotations.push({ type: 'drift', description: JSON.stringify(entry) })
}

for (const { resource, path, schema } of RESOURCES) {
  test.describe(`contract drift: ${resource}`, () => {
    test(`${resource} version responses match the adapter contract`, async ({ request }, testInfo) => {
      test.setTimeout(TEST_TIMEOUT_MS)

      // (1) Parent list — one row is enough to obtain a real id.
      const listResponse = await request.get(`${path}?page_size=1`, { timeout: REQUEST_TIMEOUT_MS })
      annotate(testInfo, {
        resource,
        endpoint: `${path}?page_size=1`,
        status: listResponse.status(),
        items: null,
        ok: listResponse.ok()
      })

      if (NOT_AVAILABLE_STATUSES.includes(listResponse.status())) {
        test.skip(true, `no access to ${resource} in target env (status ${listResponse.status()})`)
      }
      expect(listResponse.ok(), `unexpected status listing ${resource}`).toBeTruthy()

      const parents = extractResults(await listResponse.json())
      if (parents.length === 0) {
        test.skip(true, `no ${resource} available in target env`)
      }

      const resourceId = parents[0]?.id
      expect(resourceId, `${resource} row is missing an id`).toBeDefined()

      // (2) Version list — every item must validate against the contract.
      const versionsEndpoint = `${path}/${resourceId}/versions`
      const versionsResponse = await request.get(versionsEndpoint, { timeout: REQUEST_TIMEOUT_MS })
      expect(versionsResponse.status(), `GET ${versionsEndpoint}`).toBe(200)

      const versions = extractResults(await versionsResponse.json())
      const listErrors = versions.flatMap((item, index) =>
        collectErrors(schema, item).map((message) => `[version #${index}] ${message}`)
      )
      annotate(testInfo, {
        resource,
        endpoint: versionsEndpoint,
        status: versionsResponse.status(),
        items: versions.length,
        ok: listErrors.length === 0
      })
      expect(listErrors, `contract drift in ${resource} version list`).toEqual([])

      // (3) Single version — validate the detail shape too, when one exists.
      const firstVersionId = versions.length ? resolveVersionId(versions[0]) : undefined
      if (firstVersionId === undefined || firstVersionId === null) return

      const detailEndpoint = `${path}/${resourceId}/versions/${firstVersionId}`
      const detailResponse = await request.get(detailEndpoint, { timeout: REQUEST_TIMEOUT_MS })
      expect(detailResponse.status(), `GET ${detailEndpoint}`).toBe(200)

      const detailItem = unwrapItem(await detailResponse.json())
      const detailErrors = collectErrors(schema, detailItem)
      annotate(testInfo, {
        resource,
        endpoint: detailEndpoint,
        status: detailResponse.status(),
        items: 1,
        ok: detailErrors.length === 0
      })
      expect(detailErrors, `contract drift in ${resource} version detail`).toEqual([])
    })
  })
}
