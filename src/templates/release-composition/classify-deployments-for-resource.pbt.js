import { describe, it, expect } from 'vitest'
import { classifyDeploymentsForResource } from './classify-deployments-for-resource.js'

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

const SCOPED_TYPE = 'firewall'
const OTHER_TYPE = 'workload'
const SCOPED_RESOURCE_ID = 'res-target'

const withFc = (build) => (fc ? build(fc) : null)

const idPoolArb = withFc((arb) =>
  arb.constantFrom(SCOPED_RESOURCE_ID, 'res-other-1', 'res-other-2', 'res-other-3')
)

const resourceArb = withFc((arb) =>
  arb.record({
    resource_type: arb.constantFrom(SCOPED_TYPE, OTHER_TYPE),
    resource_id: idPoolArb,
    global_id: arb.oneof(arb.constant(undefined), idPoolArb)
  })
)

const deploymentArb = withFc((arb) =>
  arb.record({
    id: arb.oneof(arb.string({ minLength: 1 }), arb.integer({ min: 1 }).map(String)),
    binding_policy: arb.constantFrom('FLEXIBLE', 'STRICT')
  })
)

const deploymentsArb = withFc((arb) =>
  arb
    .uniqueArray(deploymentArb, {
      selector: (deployment) => deployment.id,
      maxLength: 20
    })
    .filter((list) => list.length > 0)
)

const activeReleaseByDsArb = withFc(
  (arb) => (deployments) =>
    arb
      .array(
        arb.oneof(
          arb.constant(null),
          arb.record({ resources: arb.array(resourceArb, { maxLength: 6 }) })
        ),
        { minLength: deployments.length, maxLength: deployments.length }
      )
      .map((releases) =>
        deployments.reduce((acc, deployment, index) => {
          const release = releases[index]
          if (release !== null) acc[deployment.id] = release
          return acc
        }, {})
      )
)

const scopedResourcesOf = (release) =>
  (Array.isArray(release?.resources) ? release.resources : []).filter(
    (resource) => resource?.resource_type === SCOPED_TYPE
  )

const scopedIdsOf = (release) =>
  scopedResourcesOf(release).map((resource) => String(resource?.resource_id ?? resource?.global_id))

const runArb = withFc((arb) =>
  deploymentsArb.chain((deployments) =>
    arb.record({
      deployments: arb.constant(deployments),
      activeReleaseByDs: activeReleaseByDsArb(deployments)
    })
  )
)

const classify = (deployments, activeReleaseByDs) =>
  classifyDeploymentsForResource({
    deployments,
    activeReleaseByDs,
    scopedType: SCOPED_TYPE,
    scopedResourceId: SCOPED_RESOURCE_ID
  })

const groupOf = (result, key) => result.groups.find((group) => group.key === key)?.deployments ?? []

describeOrSkip(`classifyDeploymentsForResource — invariants${skipReason}`, () => {
  it('never places a FLEXIBLE deployment in hidden', () => {
    fc.assert(
      fc.property(runArb, ({ deployments, activeReleaseByDs }) => {
        const result = classify(deployments, activeReleaseByDs)
        return result.hidden.every((deployment) => deployment.binding_policy !== 'FLEXIBLE')
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('hides every STRICT deployment that scopes a different resource of the same type and never the target', () => {
    fc.assert(
      fc.property(runArb, ({ deployments, activeReleaseByDs }) => {
        const result = classify(deployments, activeReleaseByDs)

        return deployments.every((deployment) => {
          const ids = scopedIdsOf(activeReleaseByDs[deployment.id])
          const linksTarget = ids.includes(SCOPED_RESOURCE_ID)
          const hasDifferent = ids.some((id) => id !== SCOPED_RESOURCE_ID)

          if (deployment.binding_policy === 'STRICT' && !linksTarget && hasDifferent) {
            return result.hidden.includes(deployment)
          }
          return true
        })
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('places every deployment linked to the target in the linked group, never available/hidden', () => {
    fc.assert(
      fc.property(runArb, ({ deployments, activeReleaseByDs }) => {
        const result = classify(deployments, activeReleaseByDs)
        const linked = groupOf(result, 'linked')
        const available = groupOf(result, 'available')

        return deployments.every((deployment) => {
          const ids = scopedIdsOf(activeReleaseByDs[deployment.id])
          if (!ids.includes(SCOPED_RESOURCE_ID)) return true

          return (
            linked.includes(deployment) &&
            !available.includes(deployment) &&
            !result.hidden.includes(deployment)
          )
        })
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('partitions the input exactly: each deployment appears in exactly one bucket', () => {
    fc.assert(
      fc.property(runArb, ({ deployments, activeReleaseByDs }) => {
        const result = classify(deployments, activeReleaseByDs)
        const linked = groupOf(result, 'linked')
        const available = groupOf(result, 'available')
        const hidden = result.hidden

        const all = [...linked, ...available, ...hidden]

        expect(all.length).toBe(deployments.length)

        return deployments.every((deployment) => {
          const occurrences =
            (linked.includes(deployment) ? 1 : 0) +
            (available.includes(deployment) ? 1 : 0) +
            (hidden.includes(deployment) ? 1 : 0)
          return occurrences === 1
        })
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('preserves the input order within each bucket', () => {
    fc.assert(
      fc.property(runArb, ({ deployments, activeReleaseByDs }) => {
        const result = classify(deployments, activeReleaseByDs)
        const order = new Map(deployments.map((deployment, index) => [deployment, index]))

        const isSorted = (bucket) =>
          bucket.every(
            (deployment, index) =>
              index === 0 || order.get(bucket[index - 1]) < order.get(deployment)
          )

        return (
          isSorted(groupOf(result, 'linked')) &&
          isSorted(groupOf(result, 'available')) &&
          isSorted(result.hidden)
        )
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
