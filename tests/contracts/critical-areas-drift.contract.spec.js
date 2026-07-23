/* eslint-env node */
/**
 * Contract drift — CRITICAL non-versioned areas (test-maturity deep review,
 * 2026-07-23). Validates the money/auth schemas the console depends on
 * (tests/contracts/schemas/{payment,mfa}.schema.js) against the PUBLISHED
 * OpenAPI spec, exactly like the versioned drift spec next door.
 *
 * Scope note (documented, not an oversight):
 *   - billing runs on GraphQL — not represented in the OpenAPI document;
 *     its consumer contract (critical-areas.consumer.test.js) is the gate.
 *   - account/info lives on the legacy /api surface — not in the v4 spec.
 *   - deployment version endpoints live in the deployment-api (separate,
 *     unpublished document) — consumer-only, same as before.
 *
 * Same runtime contract as version-api-drift: OPENAPI_SCHEMA_URL drives the
 * fetch; DRIFT_STRICT=1 turns fetch problems into failures (scheduled job);
 * known drift lives in known-drift.critical-areas.json with the staleness
 * guarantee.
 */
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import {
  getResponseSchema,
  getRequestBodySchema,
  unwrapToItemSchema,
  describeFields,
  compareResponseFields,
  compareRequestFields,
  applyKnownDrift,
  findStaleKnownDrift
} from './openapi-drift-engine'
import { creditCard, addCreditRequest, creditCardCreateRequest } from './schemas/payment.schema'
import { mfaEntry } from './schemas/mfa.schema'

const knownDrift = JSON.parse(
  readFileSync(
    resolvePath(dirname(fileURLToPath(import.meta.url)), 'known-drift.critical-areas.json'),
    'utf8'
  )
)

const SCHEMA_URL = process.env.OPENAPI_SCHEMA_URL
const REQUEST_TIMEOUT_MS = 30000
const STRICT = process.env.DRIFT_STRICT === '1'

test.skip(!SCHEMA_URL, 'OPENAPI_SCHEMA_URL not set')

// The published paths carry inconsistent prefixes (e.g. /account/auth/mfa/totp
// vs /auth/mfa/totp/{device_id}) — resolve by suffix pattern.
const findPath = (spec, suffixPattern) =>
  Object.keys(spec.paths ?? {}).find((path) => suffixPattern.test(path)) ?? null

const RESOURCES = [
  {
    resource: 'payment',
    responses: [
      {
        name: 'credit-cards list item',
        schema: creditCard,
        path: /\/payments\/credit_cards$/,
        method: 'get'
      }
    ],
    requests: [
      {
        name: 'add credit',
        schema: addCreditRequest,
        path: /\/payments\/credits$/,
        method: 'post'
      },
      {
        name: 'create credit card',
        schema: creditCardCreateRequest,
        path: /\/payments\/credit_cards$/,
        method: 'post'
      }
    ]
  },
  {
    resource: 'mfa',
    responses: [
      { name: 'totp device list item', schema: mfaEntry, path: /\/auth\/mfa\/totp$/, method: 'get' }
    ],
    requests: []
  }
]

const fetchSpec = async (request) => {
  const response = await request.get(SCHEMA_URL, {
    headers: { Accept: 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
    failOnStatusCode: false
  })
  if (!response.ok()) return { skip: `no OK response from ${SCHEMA_URL} (${response.status()})` }
  const body = await response.text()
  if (!body || !body.trim()) return { skip: `empty body from ${SCHEMA_URL}` }
  try {
    return { spec: JSON.parse(body) }
  } catch {
    try {
      const parsed = yaml.load(body)
      if (parsed && typeof parsed === 'object') return { spec: parsed }
    } catch {
      // fall through
    }
    return { skip: `published spec at ${SCHEMA_URL} is neither valid JSON nor YAML` }
  }
}

let publishedSpec = null
let skipReason = null
const allUsedKnownDrift = []

test.beforeAll(async ({ request }) => {
  const result = await fetchSpec(request)
  publishedSpec = result.spec ?? null
  skipReason = result.skip ?? null
  if (STRICT && skipReason) {
    throw new Error(
      `critical-areas-drift (strict): could not verify anything — ${skipReason}. ` +
        'The scheduled drift job must never be silently green.'
    )
  }
})

for (const { resource, responses, requests } of RESOURCES) {
  test.describe(`critical-area drift: ${resource}`, () => {
    test(`${resource} published OpenAPI matches the consumer contract`, async () => {
      test.skip(skipReason !== null, skipReason ?? 'no published spec')
      const testInfo = test.info()

      const issues = []
      for (const check of responses) {
        const path = findPath(publishedSpec, check.path)
        expect(
          path,
          `${resource}: ${check.name} endpoint missing from published OpenAPI`
        ).toBeTruthy()
        const responseSchema = getResponseSchema(
          publishedSpec,
          publishedSpec.paths[path],
          check.method
        )
        const { itemSchema } = unwrapToItemSchema(publishedSpec, responseSchema)
        expect(itemSchema, `${resource}: could not resolve an item schema at ${path}`).toBeTruthy()
        issues.push(
          ...compareResponseFields(describeFields(check.schema), itemSchema, publishedSpec)
        )
      }
      for (const check of requests) {
        const path = findPath(publishedSpec, check.path)
        if (!path) {
          testInfo.annotations.push({
            type: 'drift',
            description: JSON.stringify({ resource, request: check.name, resolvable: false })
          })
          continue
        }
        const bodySchema = getRequestBodySchema(
          publishedSpec,
          publishedSpec.paths[path],
          check.method
        )
        const { issues: requestIssues } = compareRequestFields(
          describeFields(check.schema),
          bodySchema,
          publishedSpec
        )
        issues.push(...requestIssues)
      }

      const { failures, accepted, used } = applyKnownDrift(issues, knownDrift, resource)
      allUsedKnownDrift.push(...used)
      testInfo.annotations.push({
        type: 'drift',
        description: JSON.stringify({ resource, failures, knownDrift: accepted })
      })
      expect(
        failures,
        `NEW contract drift in critical area "${resource}" (known drift lives in known-drift.critical-areas.json)`
      ).toEqual([])
    })
  })
}

test('critical-areas known-drift allowlist has no stale entries', () => {
  test.skip(skipReason !== null, skipReason ?? 'no published spec')

  const stale = findStaleKnownDrift(knownDrift, allUsedKnownDrift)
  expect(
    stale,
    'these (entry, field) pairs no longer match any real drift — retire them from known-drift.critical-areas.json'
  ).toEqual([])
})
