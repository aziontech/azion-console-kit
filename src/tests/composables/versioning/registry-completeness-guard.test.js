import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'

/**
 * REGISTRY-GUARD — the `enforce-test-exists` of the versioning domain
 * (TEST-ARCHITECTURE.md §3.2 "Registry-guard").
 *
 * The production Version Shell is registry-driven: a resource is plugged with a
 * single entry in `RESOURCE_VERSION_ROUTES` (+ a `RESOURCE_CAPABILITY` class).
 * The suite MUST mirror that: every plugged resource needs a test descriptor in
 * `RESOURCE_TEST_REGISTRY` AND a thin per-resource instantiator file. This guard
 * makes "complete coverage" a structural consequence instead of a manual chore —
 * a resource cannot be plugged into production without also being plugged into
 * the test architecture, or this file goes red with a didactic message pointing
 * at TEST-ARCHITECTURE.md.
 *
 * It parses the PRODUCTION source (not an import) so a rename/removal there is
 * caught here, and it never mocks anything: it reads real files and the real
 * registry object.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC_ROOT = resolve(HERE, '../../..') // .../src
const ROUTES_SRC = resolve(SRC_ROOT, 'composables/versioning/use-version-menu-actions.js')
const CAPABILITY_SRC = resolve(SRC_ROOT, 'composables/versioning/version-capability.js')
const THIN_ROOT = resolve(SRC_ROOT, 'tests/services/v2')

const DOC = 'TEST-ARCHITECTURE.md §3.2/§3.3'

/**
 * Extracts the top-level keys of an `export const NAME = { ... }` (or
 * `Object.freeze({ ... })`) object literal from raw source. The versioning
 * registries have no nested braces, so a non-greedy match to the first `}` is
 * exact.
 */
const parseObjectKeys = (source, declarationRe, label) => {
  const match = source.match(declarationRe)
  if (!match) {
    throw new Error(`Could not locate ${label} in its source — the guard parser needs updating.`)
  }
  const keys = []
  const keyRe = /^\s*([A-Za-z_]\w*)\s*:/gm
  let key
  while ((key = keyRe.exec(match[1])) !== null) keys.push(key[1])
  if (!keys.length)
    throw new Error(`${label} parsed to zero keys — the guard parser needs updating.`)
  return keys
}

const routeTypes = parseObjectKeys(
  readFileSync(ROUTES_SRC, 'utf8'),
  /export const RESOURCE_VERSION_ROUTES\s*=\s*\{([\s\S]*?)\n\}/,
  'RESOURCE_VERSION_ROUTES'
)

const versionedOnlyTypes = parseObjectKeys(
  readFileSync(CAPABILITY_SRC, 'utf8'),
  /export const RESOURCE_CAPABILITY\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/,
  'RESOURCE_CAPABILITY'
)

// The thin per-resource instantiator files, each declaring which descriptor it
// runs via `RESOURCE_TEST_REGISTRY.<key>`. Matched by content, not by filename,
// because the file path (edge-app) rarely equals the resource type (application).
const thinFileContents = readdirSync(THIN_ROOT)
  .map((entry) => resolve(THIN_ROOT, entry))
  .filter((path) => statSync(path).isDirectory())
  .flatMap((dir) =>
    readdirSync(dir)
      .filter((file) => /-version\.test\.js$/.test(file))
      .map((file) => ({ path: resolve(dir, file), code: readFileSync(resolve(dir, file), 'utf8') }))
  )

const thinFileFor = (resourceType) => {
  const re = new RegExp(`RESOURCE_TEST_REGISTRY\\.${resourceType}\\b`)
  return thinFileContents.find(({ code }) => re.test(code))
}

describe('registry-guard (a) — every plugged resource has a test descriptor', () => {
  it.each(routeTypes)(
    '"%s" is plugged in RESOURCE_VERSION_ROUTES and has a RESOURCE_TEST_REGISTRY descriptor',
    (resourceType) => {
      expect(
        RESOURCE_TEST_REGISTRY[resourceType],
        `"${resourceType}" is plugged (RESOURCE_VERSION_ROUTES) but has no descriptor in RESOURCE_TEST_REGISTRY.\n` +
          `Plug the resource into the test architecture: add its descriptor + a thin instantiator file (see ${DOC}).`
      ).toBeDefined()
    }
  )

  it('declares no orphan descriptor (every descriptor maps to a plugged resource)', () => {
    for (const key of Object.keys(RESOURCE_TEST_REGISTRY)) {
      expect(
        routeTypes,
        `RESOURCE_TEST_REGISTRY has "${key}" but it is not in RESOURCE_VERSION_ROUTES — stale descriptor or renamed resource (${DOC}).`
      ).toContain(key)
    }
  })
})

describe('registry-guard (b) — every descriptor carries the mandatory fields', () => {
  const entries = Object.entries(RESOURCE_TEST_REGISTRY)

  it.each(entries)(
    '%s declares service/adapter/schemas/class/baseURL',
    (resourceType, descriptor) => {
      const missing = []
      if (typeof descriptor.service !== 'function') missing.push('service (getter)')
      if (!descriptor.adapter || typeof descriptor.adapter !== 'object') missing.push('adapter')
      if (!descriptor.schemas || typeof descriptor.schemas !== 'object') missing.push('schemas')
      if (typeof descriptor.ServiceClass !== 'function')
        missing.push('ServiceClass (class constructor)')
      if (typeof descriptor.capabilityClass !== 'string' || !descriptor.capabilityClass)
        missing.push('capabilityClass')
      if (typeof descriptor.baseURL !== 'string' || !descriptor.baseURL) missing.push('baseURL')

      expect(
        missing,
        `${resourceType} descriptor is missing mandatory field(s): ${missing.join(', ')}. See ${DOC}.`
      ).toEqual([])
    }
  )

  it.each(entries)(
    '%s declares a non-empty configMarkers when it runs the shared contracts',
    (resourceType, descriptor) => {
      // configMarkers only feeds the shared adapter/service read contracts, which the
      // wrapped-envelope resource (deployment) does not run — its reads are bespoke.
      // The gate keys on the same declared divergence the shared suite already uses.
      if (descriptor.envelope !== 'standard') return
      expect(
        descriptor.configMarkers && Object.keys(descriptor.configMarkers).length,
        `${resourceType} runs the shared contracts (envelope 'standard') but its configMarkers is empty. See ${DOC}.`
      ).toBeGreaterThan(0)
    }
  )
})

describe('registry-guard (c) — descriptor class matches RESOURCE_CAPABILITY', () => {
  it.each(Object.entries(RESOURCE_TEST_REGISTRY))(
    '%s capabilityClass agrees with the production capability map',
    (resourceType, descriptor) => {
      const expected = versionedOnlyTypes.includes(resourceType) ? 'versioned-only' : 'deployable'
      expect(
        descriptor.capabilityClass,
        `${resourceType} is ${expected} in RESOURCE_CAPABILITY but the descriptor declares capabilityClass "${descriptor.capabilityClass}". Keep the test descriptor in sync (${DOC}).`
      ).toBe(expected)
    }
  )
})

describe('registry-guard (d) — every resource has a thin instantiator file', () => {
  it.each(routeTypes)(
    '"%s" has a src/tests/services/v2/*/*-version.test.js instantiator',
    (resourceType) => {
      const thin = thinFileFor(resourceType)
      expect(
        thin,
        `No thin instantiator file references RESOURCE_TEST_REGISTRY.${resourceType}.\n` +
          `Plug the resource into the test architecture: create the descriptor + a thin file ` +
          `(src/tests/services/v2/<resource>/<resource>-version.test.js) that instantiates the shared contracts. See ${DOC}.`
      ).toBeDefined()
    }
  )
})
