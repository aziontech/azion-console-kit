// @vitest-environment node
/**
 * PBT — adapter roundtrip invariant (spec test-effectiveness, req 5.1a).
 *
 * For every versioned resource: a value the adapter READS from a contract-valid
 * snapshot and WRITES back to the draft payload must survive the trip
 * untouched. The passthrough field set is DISCOVERED per resource (root keys
 * present in both the snapshot and the payload with equal primitive values),
 * so a new resource is covered automatically and a renamed field shrinks the
 * set loudly (assertion below).
 *
 * Generators produce type-matched random values; reserved-word hygiene is not
 * needed here (payload fields, not a parsed language), but strings stay in a
 * safe alphabet to keep failures readable.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { RESOURCE_TEST_REGISTRY } from '../../../support/versioning/registry'

const NUM_RUNS = 60

const arbitraryFor = (value) => {
  if (typeof value === 'boolean') return fc.boolean()
  if (typeof value === 'number') return fc.integer({ min: 0, max: 99999 })
  if (typeof value === 'string') {
    return fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), {
        minLength: 1,
        maxLength: 24
      })
      .map((chars) => chars.join(''))
  }
  return null
}

// Declared divergence (anti-over-DRY): deployment's draft transform writes a
// WRAPPED envelope with no root passthrough fields — its payload contract is
// pinned by its bespoke suite, so the roundtrip property excludes it. Keep the
// list explicit: a NEW resource must not silently skip this property.
const EXCLUDED_RESOURCES = Object.freeze({
  deployment: 'wrapped-envelope saveStrategy: transformDraftPayload exposes no root fields'
})

const roundtripValue = (descriptor, field, value) => {
  const snapshot = descriptor.buildVersion({ [field]: value })
  const config = descriptor.adapter.transformLoadVersion(snapshot).config
  return descriptor.adapter.transformDraftPayload({ ...config, comment: 'probe' })[field]
}

const discoverPassthroughFields = (descriptor) => {
  const snapshot = descriptor.buildVersion()
  const config = descriptor.adapter.transformLoadVersion(snapshot).config
  const payload = descriptor.adapter.transformDraftPayload({ ...config, comment: 'probe' })
  return Object.keys(payload).filter((key) => {
    if (key === 'comment') return false
    if (!['boolean', 'number', 'string'].includes(typeof payload[key])) return false
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) return false
    if (snapshot[key] !== payload[key]) return false
    // SEMANTIC fields (enums driving polymorphic mapping, e.g. connector.type)
    // do not survive a free-string probe — exclude them from randomization:
    // the generator must respect the domain (same lesson as reserved words).
    if (typeof payload[key] === 'string') {
      try {
        return roundtripValue(descriptor, key, 'pbt-probe-value') === 'pbt-probe-value'
      } catch {
        return false // probe threw → enum/semantic field (e.g. schema or polymorphic mapping rejects free strings)
      }
    }
    return true
  })
}

describe('PBT: adapter roundtrip preserves passthrough fields (all resources)', () => {
  const entries = Object.entries(RESOURCE_TEST_REGISTRY).filter(
    ([resource]) => !(resource in EXCLUDED_RESOURCES)
  )
  it('the exclusion list names ONLY resources that really expose no root fields', () => {
    for (const resource of Object.keys(EXCLUDED_RESOURCES)) {
      expect(RESOURCE_TEST_REGISTRY[resource], `${resource} left the registry`).toBeTruthy()
      expect(discoverPassthroughFields(RESOURCE_TEST_REGISTRY[resource])).toEqual([])
    }
  })

  for (const [resource, descriptor] of entries) {
    it(`${resource}: snapshot → config → draft payload keeps every passthrough value`, () => {
      const fields = discoverPassthroughFields(descriptor)
      // A resource with NO passthrough fields would make this test vacuous —
      // fail loudly instead of passing silently (P6).
      expect(fields.length, `${resource} exposes no passthrough fields`).toBeGreaterThan(0)

      const baseSnapshot = descriptor.buildVersion()
      const arbitraries = Object.fromEntries(
        fields
          .map((field) => [field, arbitraryFor(baseSnapshot[field])])
          .filter(([, arbitrary]) => arbitrary !== null)
      )

      fc.assert(
        fc.property(fc.record(arbitraries), (values) => {
          const snapshot = descriptor.buildVersion(values)
          const config = descriptor.adapter.transformLoadVersion(snapshot).config
          const payload = descriptor.adapter.transformDraftPayload({
            ...config,
            comment: 'pbt roundtrip'
          })
          for (const [field, value] of Object.entries(values)) {
            expect(payload[field], `${resource}.${field} lost in the roundtrip`).toEqual(value)
          }
        }),
        { numRuns: NUM_RUNS }
      )
    })
  }
})
