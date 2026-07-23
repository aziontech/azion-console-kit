/* eslint-env node */
/**
 * Service-URL contract (spec test-effectiveness, req 9.1 — decision D1/F).
 *
 * Closes the URL blind spot: the unit seam accepts ANY url string, and the
 * drift specs compare SCHEMAS, not our calls — so an endpoint typo in a
 * service reached production undetected. This spec statically extracts every
 * URL literal from src/services/v2 and verifies each against the PUBLISHED
 * OpenAPI paths (segment-wise prefix match, `${expr}` → `{param}`).
 *
 * DECLARED LIMIT: URLs assembled by non-literal concatenation at runtime are
 * invisible to static extraction — covered later by the M5 network tool
 * (unhandled-request = error) or the D3 endgame (client generated from the
 * OpenAPI, where a wrong URL cannot compile).
 *
 * Out-of-OpenAPI surfaces (legacy /api, deployment-api, GraphQL) live in
 * tests/contracts/service-urls.allowlist.json — explicit prefixes with a
 * reason, guarded by the same staleness rule as known-drift.
 */
import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '../..')
const SERVICES_DIR = join(ROOT, 'src/services/v2')
const allowlist = JSON.parse(
  readFileSync(join(ROOT, 'tests/contracts/service-urls.allowlist.json'), 'utf8')
)

const SCHEMA_URL = process.env.OPENAPI_SCHEMA_URL
const STRICT = process.env.DRIFT_STRICT === '1'
test.skip(!SCHEMA_URL, 'OPENAPI_SCHEMA_URL not set')

// ── static extraction ────────────────────────────────────────────────────────
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : walk(path)
    return name.endsWith('.js') && !/\.(test|spec)\.js$/.test(name) ? [path] : []
  })

// Captures quoted/template URL literals that look like API roots.
const URL_LITERAL = /['"`](\/?(?:v4|api|deployment-api|graphql)\/[^'"`\s]*)['"`]/g

const normalize = (url) =>
  url
    .replace(/\$\{[^}]*\}/g, '{param}')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

const extractUrls = () => {
  const found = new Map() // normalized url → first file
  for (const file of walk(SERVICES_DIR)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(URL_LITERAL)) {
      const normalized = normalize(match[1])
      if (normalized && !found.has(normalized)) {
        found.set(normalized, file.replace(`${ROOT}/`, ''))
      }
    }
  }
  return found
}

// ── OpenAPI matching ─────────────────────────────────────────────────────────
const segmentsOf = (path) => path.replace(/^\/+/, '').split('/').filter(Boolean)

const segmentMatches = (ours, published) =>
  published === ours ||
  (published.startsWith('{') && ours === '{param}') ||
  (ours.startsWith('{') && published.startsWith('{'))

// Our extracted url (minus the v4 prefix) must be a segment-wise PREFIX of at
// least one published path — service roots (baseURLs) are prefixes by design.
const matchesSpec = (url, publishedPaths) => {
  const ours = segmentsOf(url.replace(/^v4\//, ''))
  return publishedPaths.some((published) => {
    if (published.length < ours.length) return false
    return ours.every((segment, index) => segmentMatches(segment, published[index]))
  })
}

const allowlisted = (url) => allowlist.entries.find((entry) => url.startsWith(entry.prefix))

// ── the tests ────────────────────────────────────────────────────────────────
let publishedPaths = null
let skipReason = null

test.beforeAll(async ({ request }) => {
  const response = await request.get(SCHEMA_URL, { timeout: 30000, failOnStatusCode: false })
  if (!response.ok()) {
    skipReason = `no OK response from ${SCHEMA_URL} (${response.status()})`
  } else {
    try {
      const spec = yaml.load(await response.text())
      publishedPaths = Object.keys(spec.paths ?? {}).map(segmentsOf)
      if (publishedPaths.length === 0) skipReason = 'published spec has no paths'
    } catch {
      skipReason = 'published spec is neither valid JSON nor YAML'
    }
  }
  if (STRICT && skipReason) {
    throw new Error(`service-urls (strict): could not verify anything — ${skipReason}`)
  }
})

test('every v2 service URL literal matches a published OpenAPI path (or a justified allowlist prefix)', () => {
  test.skip(skipReason !== null, skipReason ?? 'no published spec')

  const urls = extractUrls()
  expect(urls.size, 'static extraction found no URLs — extractor broken').toBeGreaterThan(20)

  const offenders = []
  for (const [url, file] of urls) {
    if (allowlisted(url)) continue
    if (!matchesSpec(url, publishedPaths)) offenders.push(`  ${url}  (${file})`)
  }
  expect(
    offenders,
    `service URLs not found in the published OpenAPI (typo? or add a justified allowlist prefix):\n${offenders.join('\n')}`
  ).toEqual([])
})

test('service-urls allowlist has no stale entries', () => {
  test.skip(skipReason !== null, skipReason ?? 'no published spec')

  const urls = [...extractUrls().keys()]
  const stale = allowlist.entries.filter(
    (entry) => !urls.some((url) => url.startsWith(entry.prefix))
  )
  expect(stale, 'these allowlist prefixes no longer match any extracted URL — retire them').toEqual(
    []
  )
})
