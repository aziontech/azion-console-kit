// @vitest-environment node
/**
 * PBT — invalidation-map dedup invariant (spec test-effectiveness, req 5.1b):
 * for ANY list of SSE event titles (valid prefixes, free strings, empties,
 * repetitions), getKeysForEvents never returns the same query key twice.
 * A duplicate would double-invalidate a TanStack cache entry per event burst.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { getKeysForEvents } from '@/services/v2/base/cache-sync/invalidation-map'

const KNOWN_PREFIXES = [
  'Workloads',
  'Domain',
  'Edge Application',
  'Application',
  'ApplicationFunctionInstance',
  'CacheSetting',
  'DeviceGroup',
  'Firewall',
  'FirewallRuleEngine',
  'Rule Engine',
  'Function',
  'Team'
]

const arbTitle = fc.oneof(
  // real prefix + random suffix (the production shape: "Edge Application x was updated")
  fc
    .tuple(fc.constantFrom(...KNOWN_PREFIXES), fc.string({ maxLength: 20 }))
    .map(([prefix, suffix]) => `${prefix} ${suffix}`),
  // noise: free strings, empties, weird casing
  fc.string({ maxLength: 30 }),
  fc.constant(''),
  fc.constant(null)
)

describe('PBT: getKeysForEvents', () => {
  it('never returns a duplicated query key for any title burst', () => {
    fc.assert(
      fc.property(fc.array(arbTitle, { maxLength: 25 }), (titles) => {
        const keys = getKeysForEvents(titles)
        const serialized = keys.map((key) => JSON.stringify(key))
        expect(new Set(serialized).size).toBe(serialized.length)
      }),
      { numRuns: 120 }
    )
  })

  it('is idempotent: repeating the same burst twice yields the same keys', () => {
    fc.assert(
      fc.property(fc.array(arbTitle, { maxLength: 12 }), (titles) => {
        expect(getKeysForEvents([...titles, ...titles])).toEqual(getKeysForEvents(titles))
      }),
      { numRuns: 120 }
    )
  })
})
