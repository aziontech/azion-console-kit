import { describe, it, expect, vi } from 'vitest'

/**
 * Guard test for req 2.6 (ARCH-7): the service barrel must not have any
 * dangling re-export, and no consumer may re-export a binding the barrel
 * does not actually define.
 *
 * Concretely this pins two invariants:
 *   1. Every named export of the `real-time-events-service-v2` barrel is a
 *      defined binding (no `export { foo }` where `foo` resolves to
 *      `undefined` because the source module never exported it).
 *   2. The local view adapter (`views/RealTimeEventsV2/services`) exposes no
 *      binding that reads a missing symbol off the barrel — every one of its
 *      named exports is a defined function.
 *
 * Regression it catches: the adapter previously re-exported
 * `OriginalServices.loadEventsChartAggregation`, which the barrel never
 * exports, so the binding was silently `undefined`.
 */

// The account store is pulled in transitively by the view adapter; stub it so
// this pure structural check does not require a Pinia instance.
vi.mock('@stores/account', () => ({
  useAccountStore: () => ({ accountData: { timezone: 'UTC' } })
}))

const EXPECTED_BARREL_EXPORTS = [
  'listActivityHistory',
  'loadActivityHistory',
  'listDataStream',
  'loadDataStream',
  'listEdgeFunctions',
  'loadEdgeFunctions',
  'listEdgeFunctionsConsole',
  'loadEdgeFunctionsConsole',
  'listHttpRequest',
  'loadHttpRequest',
  'listImageProcessor',
  'loadImageProcessor',
  'listEdgeDNS',
  'loadEdgeDNS',
  'listTieredCache',
  'loadTieredCache',
  'loadFieldsEventsData',
  'getTotalRecords',
  'loadEventsCount'
]

describe('real-time-events-service-v2 barrel · export integrity (req 2.6 / ARCH-7)', () => {
  it('exports exactly the expected named set', async () => {
    const barrel = await import('../index.js')
    const actual = Object.keys(barrel).sort()
    expect(actual).toEqual([...EXPECTED_BARREL_EXPORTS].sort())
  })

  it('has no dangling (undefined) re-export', async () => {
    const barrel = await import('../index.js')
    for (const name of Object.keys(barrel)) {
      expect(barrel[name], `barrel export "${name}" must be defined`).toBeTypeOf('function')
    }
  })

  it('does not export the chart-aggregation loader (imported directly, not via barrel)', async () => {
    const barrel = await import('../index.js')
    expect(barrel).not.toHaveProperty('loadEventsChartAggregation')
  })
})

describe('RealTimeEventsV2 view adapter · no dangling re-export off the barrel (req 2.6)', () => {
  it('every named export resolves to a defined function', async () => {
    const adapter = await import('@/views/RealTimeEventsV2/services')
    const names = Object.keys(adapter)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      expect(adapter[name], `adapter export "${name}" must be defined`).toBeTypeOf('function')
    }
  })

  it('does not re-export loadEventsChartAggregation (barrel does not define it)', async () => {
    const adapter = await import('@/views/RealTimeEventsV2/services')
    expect(adapter).not.toHaveProperty('loadEventsChartAggregation')
  })
})
