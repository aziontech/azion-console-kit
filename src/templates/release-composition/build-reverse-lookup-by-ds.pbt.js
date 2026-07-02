import { describe, it, expect } from 'vitest'
import { buildReverseLookupByDs } from './build-reverse-lookup-by-ds.js'

let fc = null
try {
  // eslint-disable-next-line global-require
  fc = (await import('fast-check')).default
} catch {
  fc = null
}

const NUM_RUNS = 100

const describeOrSkip = fc ? describe : describe.skip
const skipReason = fc ? '' : ' (SKIPPED: fast-check is not installed)'

const withFc = (build) => (fc ? build(fc) : null)

const ENV_IDS = ['env-1', 'env-2', 'env-3', 'env-orphan']

const idArb = withFc((arb) => arb.oneof(arb.string({ minLength: 1 }), arb.integer({ min: 1 })))

const nameArb = withFc((arb) =>
  arb.oneof(arb.string(), arb.record({ text: arb.string(), tagProps: arb.constant({}) }))
)

const bindingArb = withFc((arb) =>
  arb.record({
    deployment_id: arb.oneof(
      arb.string({ minLength: 1 }),
      arb.integer({ min: 1 }),
      arb.constant(null)
    ),
    environment_id: arb.oneof(arb.constantFrom(...ENV_IDS), arb.constant(null)),
    domains: arb.array(arb.string(), { maxLength: 4 })
  })
)

const workloadArb = withFc((arb) =>
  arb.record({
    id: idArb,
    name: nameArb,
    active: arb.record({ content: arb.constantFrom('Active', 'Inactive') }),
    bindings: arb.array(bindingArb, { maxLength: 6 })
  })
)

const workloadsArb = withFc((arb) => arb.array(workloadArb, { maxLength: 12 }))

const envMapArb = withFc((arb) =>
  arb
    .array(
      arb.tuple(
        arb.constantFrom(...ENV_IDS.filter((id) => id !== 'env-orphan')),
        arb.string({ minLength: 1 })
      ),
      { maxLength: 3 }
    )
    .map((entries) => new Map(entries))
)

const inputArb = withFc((arb) => arb.record({ workloads: workloadsArb, envMap: envMapArb }))

const expectedName = (name) => (name && typeof name === 'object' ? name.text : name)

const allRows = (index) => Object.values(index).flat()

describeOrSkip(`buildReverseLookupByDs — invariants${skipReason}`, () => {
  it('normalizes name: {text} becomes text, a string stays itself, and row.name is never an object', () => {
    fc.assert(
      fc.property(inputArb, ({ workloads, envMap }) => {
        const index = buildReverseLookupByDs(workloads, envMap)
        const byId = new Map(workloads.map((workload) => [workload.id, workload]))
        return allRows(index).every(
          (row) => typeof row.name !== 'object' && row.name === expectedName(byId.get(row.id)?.name)
        )
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('emits rows only from Active workloads', () => {
    fc.assert(
      fc.property(inputArb, ({ workloads, envMap }) => {
        const activeIds = new Set(
          workloads
            .filter((workload) => workload.active?.content === 'Active')
            .map((workload) => workload.id)
        )
        const index = buildReverseLookupByDs(workloads, envMap)
        return allRows(index).every((row) => activeIds.has(row.id))
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('ignores bindings without a deployment_id: row count equals active bindings that carry one', () => {
    fc.assert(
      fc.property(inputArb, ({ workloads, envMap }) => {
        const index = buildReverseLookupByDs(workloads, envMap)
        const expected = workloads
          .filter((workload) => workload.active?.content === 'Active')
          .flatMap((workload) => workload.bindings ?? [])
          .filter((binding) => binding.deployment_id != null).length
        expect(allRows(index).length).toBe(expected)
        return Object.keys(index).every(
          (key) => key !== 'null' && key !== 'undefined' && key !== ''
        )
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('never fabricates environmentName: it is exactly envMap.get(environmentId) or null', () => {
    fc.assert(
      fc.property(inputArb, ({ workloads, envMap }) => {
        const index = buildReverseLookupByDs(workloads, envMap)
        return allRows(index).every(
          (row) => row.environmentName === (envMap.get(row.environmentId) ?? null)
        )
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('always yields an array for domains', () => {
    fc.assert(
      fc.property(inputArb, ({ workloads, envMap }) => {
        const index = buildReverseLookupByDs(workloads, envMap)
        return allRows(index).every((row) => Array.isArray(row.domains))
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
