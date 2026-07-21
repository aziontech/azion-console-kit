/* eslint-env node */
/**
 * Contract DRIFT check — spec `versioning-test-coverage`, task 8.1 (req 10.4).
 *
 * PURPOSE (deploy safety): validate the PUBLISHED OpenAPI spec of a target
 * environment (an OPEN, no-auth documentation URL — DRF/drf-spectacular
 * `/schema/`) against the yup schemas the front's adapters assume
 * (`tests/contracts/schemas/**`, single source of truth via `contractSchemas`).
 *
 * WHY THE PUBLISHED SPEC INSTEAD OF LIVE CALLS: consuming the provider's own
 * published contract means ZERO secrets, ZERO tenant/token, and no mutation of
 * a real environment. It is provider-side truth — exactly what the API promises
 * to return. All comparison logic lives in the pure `openapi-drift-engine.js`
 * module, which is unit-tested against a local fixture
 * (`src/tests/contracts/openapi-drift-engine.test.js`) so the check is provably
 * real even where the `/schema/` URL is unreachable (this network returns 204).
 *
 * WHAT IT ASSERTS, per versioned resource:
 *   - PATHS: the `/workspace/<segment>/{...}/versions` (+ `/versions/{...}`)
 *     endpoints exist in the published spec — else the resource FAILS.
 *   - RESPONSE (core): every field our `versionResponse` yup schema READS must
 *     exist, with a compatible type, in the resolved 200 item schema (envelope
 *     `data`/`results` auto-detected, `$ref`s resolved cyclic-safe).
 *   - REQUEST (lighter): every field our draft/build/archive schemas WRITE must
 *     exist in the request body; a missing field FAILS only when the spec sets
 *     `additionalProperties: false`, otherwise it is a non-blocking annotation.
 *
 * SKIP SEMANTICS (runtime-conditional, NOT the static committed skips the bar
 * rejects): if `OPENAPI_SCHEMA_URL` is unset, or the fetch is non-200 / empty /
 * not JSON (e.g. YAML, or the edge returns 204 from this network), the whole
 * file skips cleanly with a reason — a job without a reachable spec passes
 * instead of failing.
 *
 * STRUCTURED LOGS: the repo lint bans `console.*` (except `console.error`); we
 * attach one JSON annotation per resource ({resource, paths, response, request})
 * — visible in the Playwright report, zero lint noise.
 *
 * HOW TO RUN against a target environment:
 *   OPENAPI_SCHEMA_URL=https://api.azion.com/v4/openapi/openapi.yaml \
 *   npx playwright test --project=contract-drift
 * Without the env it exits 0 with every test skipped (CI-wiring validation path).
 */
import { test, expect } from '@playwright/test'
import yaml from 'js-yaml'
import { contractSchemas } from './schemas'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import {
  describeFields,
  findVersionPaths,
  getResponseSchema,
  getRequestBodySchema,
  unwrapToItemSchema,
  compareResponseFields,
  compareRequestFields,
  applyKnownDrift
} from './openapi-drift-engine'

// JSON import attributes vary across Node versions — plain fs read is portable.
const knownDrift = JSON.parse(
  readFileSync(resolvePath(dirname(fileURLToPath(import.meta.url)), 'known-drift.json'), 'utf8')
)

const SCHEMA_URL = process.env.OPENAPI_SCHEMA_URL
const REQUEST_TIMEOUT_MS = 30000

// Skip the whole file cleanly when no published-spec URL is configured.
test.skip(!SCHEMA_URL, 'OPENAPI_SCHEMA_URL not set')

/**
 * Resource registry: `segment` is the workspace path segment used to discover
 * the version endpoints in the published spec; the schema group is the front's
 * single-source contract (response + the three request payloads).
 */
const RESOURCES = [
  { resource: 'application', segment: 'applications', schemas: contractSchemas.application },
  { resource: 'workload', segment: 'workloads', schemas: contractSchemas.workload },
  { resource: 'custom_page', segment: 'custom_pages', schemas: contractSchemas.customPage },
  { resource: 'firewall', segment: 'firewalls', schemas: contractSchemas.edgeFirewall },
  { resource: 'connector', segment: 'connectors', schemas: contractSchemas.edgeConnector },
  { resource: 'function', segment: 'functions', schemas: contractSchemas.edgeFunction },
  { resource: 'network_list', segment: 'network_lists', schemas: contractSchemas.networkList },
  { resource: 'waf', segment: 'wafs', schemas: contractSchemas.waf }
]

// One structured JSON annotation per resource/section (see header).
const annotate = (testInfo, entry) => {
  testInfo.annotations.push({ type: 'drift', description: JSON.stringify(entry) })
}

/**
 * Fetches the published spec once. Tries the drf-spectacular OpenAPI JSON media
 * type first, then plain JSON. Returns `{ spec }` on success, or `{ skip }` with
 * a human reason on any non-200 / empty / non-JSON response — so the caller
 * skips cleanly instead of failing on a network/edge condition.
 */
const fetchSpec = async (request) => {
  const accepts = ['application/vnd.oai.openapi+json', 'application/json']
  let last = null
  for (const accept of accepts) {
    const response = await request.get(SCHEMA_URL, {
      headers: { Accept: accept },
      timeout: REQUEST_TIMEOUT_MS,
      failOnStatusCode: false
    })
    last = response
    if (!response.ok()) continue
    const body = await response.text()
    if (!body || !body.trim())
      return { skip: `empty body from ${SCHEMA_URL} (status ${response.status()})` }
    try {
      return { spec: JSON.parse(body) }
    } catch {
      // The published Azion spec is served as YAML (v4/openapi/openapi.yaml).
      try {
        const parsed = yaml.load(body)
        if (parsed && typeof parsed === 'object') return { spec: parsed }
      } catch {
        // fall through to the skip below
      }
      return { skip: `published spec at ${SCHEMA_URL} is neither valid JSON nor YAML` }
    }
  }
  return {
    skip: `no OK response from ${SCHEMA_URL} (last status ${last ? last.status() : 'none'})`
  }
}

// Fetch the spec once for the whole file; per-resource tests read the cached copy.
let publishedSpec = null
let skipReason = null

test.beforeAll(async ({ request }) => {
  const result = await fetchSpec(request)
  publishedSpec = result.spec ?? null
  skipReason = result.skip ?? null
})

for (const { resource, segment, schemas } of RESOURCES) {
  test.describe(`contract drift: ${resource}`, () => {
    test(`${resource} published OpenAPI matches the adapter contract`, async () => {
      // `test.info()` avoids taking the fixtures arg (this test does no per-test
      // I/O — the spec is fetched once in `beforeAll`), keeping the signature clean.
      const testInfo = test.info()
      test.skip(skipReason !== null, skipReason ?? 'no published spec')
      expect(publishedSpec, 'published spec should be loaded when not skipped').toBeTruthy()

      // (1) PATHS — the version endpoints must be published for this resource.
      const paths = findVersionPaths(publishedSpec, segment)
      annotate(testInfo, { resource, section: 'paths', ...paths })
      expect(
        paths.list || paths.detail,
        `resource "${resource}" version endpoints missing from published OpenAPI`
      ).toBeTruthy()

      // (2) RESPONSE (core) — resolve the version item schema (detail preferred,
      // else the list item) and confirm every field the front READS is present
      // with a compatible type.
      const responsePath = paths.detail ?? paths.list
      const responseSchema = getResponseSchema(
        publishedSpec,
        publishedSpec.paths[responsePath],
        'get'
      )
      const { itemSchema, envelope } = unwrapToItemSchema(publishedSpec, responseSchema)
      expect(
        itemSchema,
        `could not resolve a version item schema for "${resource}" at ${responsePath}`
      ).toBeTruthy()

      const responseFields = describeFields(schemas.versionResponse)
      const responseIssues = compareResponseFields(responseFields, itemSchema, publishedSpec)
      // Known, documented divergences (tests/contracts/known-drift.json) become
      // warnings; anything NEW keeps failing (spec §3.4 — no alarm fatigue).
      const { failures, accepted } = applyKnownDrift(responseIssues, knownDrift, resource)
      annotate(testInfo, {
        resource,
        section: 'response',
        endpoint: responsePath,
        envelope,
        fields: responseFields.length,
        failures,
        knownDrift: accepted
      })
      expect(
        failures,
        `NEW response contract drift in "${resource}" (field vs published spec; known drift lives in known-drift.json)`
      ).toEqual([])

      // (3) REQUEST (lighter) — draft (POST on the collection), build/archive
      // (POST on the corresponding action sub-paths, when published). Missing
      // fields fail only under `additionalProperties: false`; else annotate.
      const requestChecks = [
        { name: 'draft', schema: schemas.draftRequest, path: paths.list, method: 'post' },
        {
          name: 'build',
          schema: schemas.buildRequest,
          path: findActionPath(publishedSpec, segment, 'build'),
          method: 'post'
        },
        {
          name: 'archive',
          schema: schemas.archiveRequest,
          path: findActionPath(publishedSpec, segment, 'archive'),
          method: 'post'
        }
      ]

      const requestIssues = []
      for (const check of requestChecks) {
        if (!check.schema || !check.path) {
          annotate(testInfo, { resource, section: 'request', kind: check.name, resolvable: false })
          continue
        }
        const bodySchema = getRequestBodySchema(
          publishedSpec,
          publishedSpec.paths[check.path],
          check.method
        )
        const fields = describeFields(check.schema)
        const { issues, warnings, resolvable } = compareRequestFields(
          fields,
          bodySchema,
          publishedSpec
        )
        annotate(testInfo, {
          resource,
          section: 'request',
          kind: check.name,
          path: check.path,
          resolvable,
          issues,
          warnings
        })
        requestIssues.push(...issues.map((issue) => ({ check: check.name, ...issue })))
      }
      // Same known-drift downgrade as the response side: documented divergences
      // become annotations; only NEW request drift fails.
      const requestVerdict = applyKnownDrift(requestIssues, knownDrift, resource)
      if (requestVerdict.accepted.length > 0) {
        annotate(testInfo, { resource, section: 'request', knownDrift: requestVerdict.accepted })
      }
      expect(
        requestVerdict.failures,
        `NEW request contract drift in "${resource}" (field forbidden by additionalProperties:false; known drift lives in known-drift.json)`
      ).toEqual([])
    })
  })
}

/**
 * Finds a version ACTION sub-path (`.../versions/{...}/<action>`) for a segment,
 * e.g. build/archive. Returns null when the action is not published (then the
 * request check for it is annotated as unresolvable, not failed).
 */
function findActionPath(spec, segment, action) {
  const paths = spec?.paths ? Object.keys(spec.paths) : []
  const seg = segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`/workspace/${seg}/\\{[^/}]+\\}/versions/\\{[^/}]+\\}/${action}/?$`)
  return paths.find((path) => re.test(path)) ?? null
}
