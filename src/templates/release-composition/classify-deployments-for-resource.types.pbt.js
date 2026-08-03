import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { classifyDeploymentsForResource } from './classify-deployments-for-resource.js'

const NUM_RUNS = 200

const SCOPED_TYPES = ['application', 'firewall', 'custom_page']

const idArb = fc.oneof(fc.integer({ min: 1, max: 9999 }).map(String), fc.uuid())

const bindingPolicyArb = fc.constantFrom('FLEXIBLE', 'STRICT', 'UNKNOWN', undefined)

const deploymentArb = fc.record({
  id: idArb,
  binding_policy: bindingPolicyArb
})

const scenarioArb = fc
  .array(
    fc.record({
      deployment: deploymentArb,
      hasScopedResource: fc.boolean(),
      resourceIsTarget: fc.boolean(),
      otherResourceId: idArb
    }),
    { minLength: 1, maxLength: 12 }
  )
  .map((rows) => {
    const seen = new Set()
    return rows.filter((row) => {
      if (seen.has(row.deployment.id)) return false
      seen.add(row.deployment.id)
      return true
    })
  })

const keyedResource = (scopedType, id, matchesTarget) => {
  if (scopedType === 'application') {
    return {
      resource_type: 'application',
      global_id: matchesTarget ? id : `noise-${id}`,
      resource_id: null
    }
  }
  return {
    resource_type: scopedType,
    resource_id: matchesTarget ? id : `noise-${id}`
  }
}

const buildInputForType = (scenario, scopedType, scopedResourceId) => {
  const deployments = scenario.map((row) => ({ ...row.deployment }))
  const activeReleaseByDs = {}

  scenario.forEach((row) => {
    const resources = []
    if (row.hasScopedResource) {
      const chosenId = row.resourceIsTarget ? scopedResourceId : row.otherResourceId
      resources.push(keyedResource(scopedType, chosenId, row.resourceIsTarget))
    }
    resources.push({ resource_type: 'unrelated', resource_id: `x-${row.deployment.id}` })
    activeReleaseByDs[row.deployment.id] = { resources }
  })

  return { deployments, activeReleaseByDs, scopedType, scopedResourceId }
}

const idsOf = (group) => group.deployments.map((deployment) => deployment.id)

const shapeOf = (result) => ({
  linked: idsOf(result.groups.find((group) => group.key === 'linked')),
  available: idsOf(result.groups.find((group) => group.key === 'available')),
  hidden: result.hidden.map((deployment) => deployment.id)
})

describe('classifyDeploymentsForResource — Property: classification is scopedType-agnostic', () => {
  it('produces identical grouping across application/firewall/custom_page for the same logical scenario', () => {
    fc.assert(
      fc.property(scenarioArb, idArb, (scenario, scopedResourceId) => {
        const shapes = SCOPED_TYPES.map((scopedType) =>
          shapeOf(
            classifyDeploymentsForResource(
              buildInputForType(scenario, scopedType, scopedResourceId)
            )
          )
        )

        const [reference] = shapes
        shapes.slice(1).forEach((shape) => {
          expect(shape).toEqual(reference)
        })
      }),
      { numRuns: NUM_RUNS }
    )
  })

  it('groups each deployment consistently with its logical binding/policy regardless of type', () => {
    fc.assert(
      fc.property(
        scenarioArb,
        idArb,
        fc.constantFrom(...SCOPED_TYPES),
        (scenario, scopedResourceId, scopedType) => {
          const result = classifyDeploymentsForResource(
            buildInputForType(scenario, scopedType, scopedResourceId)
          )
          const { linked, available, hidden } = shapeOf(result)

          scenario.forEach((row) => {
            const id = row.deployment.id
            const isLinked = row.hasScopedResource && row.resourceIsTarget
            const policy = row.deployment.binding_policy

            if (isLinked) {
              expect(linked).toContain(id)
              return
            }

            if (policy === 'FLEXIBLE') {
              expect(available).toContain(id)
              return
            }

            if (policy === 'STRICT' && !row.hasScopedResource) {
              expect(available).toContain(id)
              return
            }

            expect(hidden).toContain(id)
          })
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })
})

describe('classifyDeploymentsForResource — Property: keying differs by type (global_id for application)', () => {
  it('matches application releases via global_id (not resource_id) and other types via resource_id', () => {
    fc.assert(
      fc.property(
        fc.array(deploymentArb, { minLength: 1, maxLength: 10 }),
        idArb,
        (deploymentsRaw, scopedResourceId) => {
          const seen = new Set()
          const deployments = deploymentsRaw.filter((deployment) => {
            if (seen.has(deployment.id)) return false
            seen.add(deployment.id)
            return true
          })

          const appReleaseByDs = {}
          const firewallReleaseByDs = {}
          deployments.forEach((deployment) => {
            appReleaseByDs[deployment.id] = {
              resources: [
                {
                  resource_type: 'application',
                  global_id: scopedResourceId,
                  resource_id: `different-${deployment.id}`
                }
              ]
            }
            firewallReleaseByDs[deployment.id] = {
              resources: [
                {
                  resource_type: 'firewall',
                  resource_id: scopedResourceId
                }
              ]
            }
          })

          const appResult = classifyDeploymentsForResource({
            deployments,
            activeReleaseByDs: appReleaseByDs,
            scopedType: 'application',
            scopedResourceId
          })
          const firewallResult = classifyDeploymentsForResource({
            deployments,
            activeReleaseByDs: firewallReleaseByDs,
            scopedType: 'firewall',
            scopedResourceId
          })

          const appLinked = idsOf(appResult.groups.find((group) => group.key === 'linked'))
          const firewallLinked = idsOf(
            firewallResult.groups.find((group) => group.key === 'linked')
          )

          deployments.forEach((deployment) => {
            expect(appLinked).toContain(deployment.id)
            expect(firewallLinked).toContain(deployment.id)
          })
        }
      ),
      { numRuns: NUM_RUNS }
    )
  })

  it('links an application release by global_id even when resource_id is absent/mismatched', () => {
    fc.assert(
      fc.property(deploymentArb, idArb, (deployment, scopedResourceId) => {
        const activeReleaseByDs = {
          [deployment.id]: {
            resources: [
              {
                resource_type: 'application',
                global_id: scopedResourceId
              }
            ]
          }
        }

        const result = classifyDeploymentsForResource({
          deployments: [deployment],
          activeReleaseByDs,
          scopedType: 'application',
          scopedResourceId
        })

        const linked = idsOf(result.groups.find((group) => group.key === 'linked'))
        expect(linked).toContain(deployment.id)
      }),
      { numRuns: NUM_RUNS }
    )
  })
})
