/**
 * Property-based test for `buildReverseLookupByDs` (spec task 3.2, Property 1).
 *
 * Property 1 — active-only + guaranteed-fields-only + no fabricated env name:
 *   1. No inactive workload ever contributes a row to the index.
 *   2. Every emitted row has EXACTLY the contract keys
 *      { id, name, domains, environmentId, environmentName } — no extra keys.
 *   3. `environmentName` is `null` whenever the binding's `environment_id` is
 *      absent from the supplied `envNameById` map (the name is never invented).
 *
 * Validates requirements 3.2, 3.3, 4.2, 7.3.
 *
 * fast-check is NOT yet a devDependency of this repo (see spec task 1.2
 * blockers). The W0 arbitraries in `__tests__/arbitraries.js` already load it
 * lazily and take the `fc` module as an argument, so this PBT mirrors that:
 * it tries to import fast-check and, if absent, registers a SKIPPED suite with
 * a clear reason instead of failing the run. Once fast-check is installed the
 * suite runs unchanged at >= 100 iterations.
 */
import { describe, it, expect } from 'vitest'
import { buildReverseLookupByDs } from './build-reverse-lookup-by-ds'
import {
  workloadsListArb,
  envNameMapArb
} from '../../services/v2/release-impact/__tests__/arbitraries'

// The complete, closed set of keys a reverse-lookup row may carry (design §3.2).
const CONTRACT_ROW_KEYS = ['id', 'name', 'domains', 'environmentId', 'environmentName']

// fast-check is optional today; load it lazily so the file stays importable.
let fc = null
try {
  // eslint-disable-next-line global-require
  fc = (await import('fast-check')).default
} catch {
  fc = null
}

const NUM_RUNS = 100

const describeOrSkip = fc ? describe : describe.skip
const skipReason = fc ? '' : ' (SKIPPED: fast-check is not installed — see spec task 1.2 blockers)'

describeOrSkip(`buildReverseLookupByDs — Property 1${skipReason}`, () => {
  it('never emits a row for an inactive workload', () => {
    fc.assert(
      fc.property(workloadsListArb(fc), envNameMapArb(fc), (workloads, envNameById) => {
        const index = buildReverseLookupByDs(workloads, envNameById)

        const inactiveIds = new Set(
          workloads.filter((wl) => wl?.active?.content !== 'Active').map((wl) => wl.id)
        )
        const emittedIds = Object.values(index)
          .flat()
          .map((row) => row.id)

        return emittedIds.every((id) => !inactiveIds.has(id))
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('emits rows with exactly the contract keys and nothing else', () => {
    fc.assert(
      fc.property(workloadsListArb(fc), envNameMapArb(fc), (workloads, envNameById) => {
        const index = buildReverseLookupByDs(workloads, envNameById)

        return Object.values(index)
          .flat()
          .every((row) => {
            const keys = Object.keys(row).sort()
            const expectedKeys = [...CONTRACT_ROW_KEYS].sort()
            return (
              keys.length === expectedKeys.length &&
              keys.every((key, idx) => key === expectedKeys[idx])
            )
          })
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('keeps environmentName null whenever the env id is absent from the map', () => {
    fc.assert(
      fc.property(workloadsListArb(fc), envNameMapArb(fc), (workloads, envNameById) => {
        const index = buildReverseLookupByDs(workloads, envNameById)

        return Object.values(index)
          .flat()
          .every((row) => {
            if (!envNameById.has(row.environmentId)) {
              return row.environmentName === null
            }
            // Present in the map => name must equal the map value (never invented).
            return row.environmentName === envNameById.get(row.environmentId)
          })
      }),
      { numRuns: NUM_RUNS }
    )
  })
})

// A non-PBT smoke assertion so the file is meaningful even without fast-check:
// it documents the active-only + contract-keys + null-name contract against a
// hand-built case, and keeps the spec file self-verifying when the suite skips.
describe('buildReverseLookupByDs — Property 1 (deterministic guard)', () => {
  it('drops inactive workloads, keeps the contract keys, and never fabricates a name', () => {
    const workloads = [
      {
        id: 'wl-active',
        name: { text: 'Active', tagProps: {} },
        active: { content: 'Active' },
        bindings: [
          // env id absent from the map => name must stay null
          { deployment_id: 'ds-1', environment_id: 'env-unknown', domains: ['a.example.com'] }
        ]
      },
      {
        id: 'wl-inactive',
        name: { text: 'Inactive', tagProps: {} },
        active: { content: 'Inactive' },
        bindings: [
          { deployment_id: 'ds-1', environment_id: 'env-known', domains: ['b.example.com'] }
        ]
      }
    ]
    const envNameById = new Map([['env-known', 'Known']])

    const index = buildReverseLookupByDs(workloads, envNameById)
    const rows = Object.values(index).flat()

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('wl-active')
    expect(Object.keys(rows[0]).sort()).toEqual([...CONTRACT_ROW_KEYS].sort())
    expect(rows[0].environmentName).toBeNull()
  })
})
