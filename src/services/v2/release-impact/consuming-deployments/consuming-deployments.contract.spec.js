import { describe, it, expect } from 'vitest'
import { createFanoutResolver } from './fanout-resolver'
import { createResourceUsageResolver } from './resource-usage-resolver'
import { assertConsumingDeploymentsShape, resourceKey } from './contract'

let fc = null
try {
  fc = (await import('fast-check')).default
} catch {
  fc = null
}
const NUM_RUNS = 100

const dsListResponse = (ids) => ({ body: ids.map((id) => ({ id })), count: ids.length })

/**
 * @typedef {object} ContractScenario
 * @property {string[]} dsIds
 * @property {Object<string, {resources: object[]}>} releaseByDs
 * @property {Array<{resource_type:string, resource_id:(string|number)}>} resources
 */

const fanoutServicesFor = (scenario) => ({
  deploymentService: {
    listDeploymentsService: () => Promise.resolve(dsListResponse(scenario.dsIds))
  },
  deploymentReleaseService: {
    getActiveReleaseComposition: (dsId) =>
      Promise.resolve(scenario.releaseByDs[dsId] ?? { resources: [] })
  }
})

const resourceUsageServicesFor = (scenario) => ({
  resourceUsageService: {
    listResourceUsage: ({ resourceType, resourceIds }) => {
      const wanted = new Set(resourceIds.map(String))
      const rows = scenario.dsIds
        .map((dsId) => {
          const releaseResources = scenario.releaseByDs[dsId]?.resources ?? []
          const matched = releaseResources.filter((resource) => {
            if (resource.resource_type !== resourceType) return false
            const idField = resource.resource_id ?? resource.global_id
            return wanted.has(String(idField))
          })
          if (matched.length === 0) return null
          return {
            deployment_id: dsId,
            resources: matched.map((resource) => ({
              resource_type: resource.resource_type,
              resource_id: resource.resource_id,
              global_id: resource.global_id,
              resource_version: resource.version_id
            }))
          }
        })
        .filter(Boolean)
      return Promise.resolve({ body: rows, count: rows.length })
    }
  }
})

const releaseResource = ({ resource_type, resource_id, global_id, version_id }) => ({
  resource_type,
  ...(resource_id != null ? { resource_id } : {}),
  ...(global_id != null ? { global_id } : {}),
  version_id
})

/**
 * @param {object} cfg
 * @param {string} cfg.name
 * @param {(scenario: ContractScenario) => import('./contract').ResolveConsumingDeployments} cfg.makeResolver
 */
export const runConsumingDeploymentsContract = ({ name, makeResolver }) => {
  describe(`resolveConsumingDeployments contract — ${name} (Property 3)`, () => {
    it('returns a result that satisfies the interface shape', async () => {
      const scenario = {
        dsIds: ['ds-1', 'ds-2'],
        releaseByDs: {
          'ds-1': {
            resources: [
              releaseResource({ resource_type: 'function', resource_id: 'fn-1', version_id: 'v1' })
            ]
          },
          'ds-2': { resources: [] }
        },
        resources: [{ resource_type: 'function', resource_id: 'fn-1' }]
      }

      const result = await makeResolver(scenario)(scenario.resources)

      expect(assertConsumingDeploymentsShape(result)).toBe(true)
    })

    it('matches an `application` ref by `resource_id` and carries its pinned version', async () => {
      const scenario = {
        dsIds: ['ds-1'],
        releaseByDs: {
          'ds-1': {
            resources: [
              releaseResource({
                resource_type: 'application',
                resource_id: 'app-global-1',
                version_id: 'av-7'
              })
            ]
          }
        },
        resources: [{ resource_type: 'application', resource_id: 'app-global-1' }]
      }

      const result = await makeResolver(scenario)(scenario.resources)

      expect(assertConsumingDeploymentsShape(result)).toBe(true)
      expect(result.deployments).toHaveLength(1)
      const [ds] = result.deployments
      expect(ds.deploymentId).toBe('ds-1')
      expect(ds.activeVersionByResource[resourceKey(scenario.resources[0])]).toBe('av-7')
    })

    it('de-duplicates the union by deployment_id when one DS consumes many requested resources', async () => {
      const appRef = { resource_type: 'application', resource_id: 'app-global-1' }
      const fnRef = { resource_type: 'function', resource_id: 'fn-9' }
      const scenario = {
        dsIds: ['ds-1', 'ds-2'],
        releaseByDs: {
          'ds-1': {
            resources: [
              releaseResource({
                resource_type: 'application',
                global_id: 'app-global-1',
                version_id: 'av-1'
              }),
              releaseResource({
                resource_type: 'function',
                resource_id: 'fn-9',
                version_id: 'fv-1'
              })
            ]
          },
          'ds-2': {
            resources: [
              releaseResource({
                resource_type: 'function',
                resource_id: 'fn-9',
                version_id: 'fv-2'
              })
            ]
          }
        },
        resources: [appRef, fnRef]
      }

      const result = await makeResolver(scenario)(scenario.resources)

      expect(assertConsumingDeploymentsShape(result)).toBe(true)

      const ids = result.deployments.map((deployment) => deployment.deploymentId)
      expect(new Set(ids).size).toBe(ids.length)
      expect(new Set(ids)).toEqual(new Set(['ds-1', 'ds-2']))

      const ds1Matches = result.matchedByDeployment.get('ds-1')
      expect(ds1Matches.map(resourceKey).sort()).toEqual(
        [resourceKey(appRef), resourceKey(fnRef)].sort()
      )

      const ds1 = result.deployments.find((deployment) => deployment.deploymentId === 'ds-1')
      expect(ds1.activeVersionByResource[resourceKey(appRef)]).toBe('av-1')
      expect(ds1.activeVersionByResource[resourceKey(fnRef)]).toBe('fv-1')
    })

    it('resolves to the empty result (never rejects) when nothing matches', async () => {
      const scenario = {
        dsIds: ['ds-1'],
        releaseByDs: {
          'ds-1': {
            resources: [
              releaseResource({ resource_type: 'function', resource_id: 'other', version_id: 'v1' })
            ]
          }
        },
        resources: [{ resource_type: 'function', resource_id: 'absent' }]
      }

      const result = await makeResolver(scenario)(scenario.resources)

      expect(assertConsumingDeploymentsShape(result)).toBe(true)
      expect(result.deployments).toEqual([])
      expect(result.matchedByDeployment.size).toBe(0)
    })
  })

  const describeOrSkip = fc ? describe : describe.skip
  const skipReason = fc
    ? ''
    : ' (SKIPPED: fast-check is not installed — see spec task 1.2 blockers)'

  describeOrSkip(
    `resolveConsumingDeployments contract — ${name} (Property 3, PBT)${skipReason}`,
    () => {
      const scenarioArb = () => {
        const resourceArb = fc.record({
          resource_type: fc.constantFrom('application', 'function', 'firewall', 'waf'),
          resource_id: fc.constantFrom('r-1', 'r-2', 'r-3')
        })
        return fc
          .record({
            dsIds: fc.uniqueArray(fc.constantFrom('ds-1', 'ds-2', 'ds-3', 'ds-4'), {
              minLength: 1,
              maxLength: 4
            }),
            resources: fc.uniqueArray(resourceArb, {
              minLength: 1,
              maxLength: 4,
              selector: (resource) => `${resource.resource_type}:${resource.resource_id}`
            }),
            consumedSubsets: fc.array(fc.array(fc.boolean(), { minLength: 0, maxLength: 4 }), {
              minLength: 0,
              maxLength: 4
            })
          })
          .map(({ dsIds, resources, consumedSubsets }) => {
            const releaseByDs = {}
            dsIds.forEach((dsId, dsIndex) => {
              const flags = consumedSubsets[dsIndex] ?? []
              const consumed = resources.filter((unused, resourceIndex) => flags[resourceIndex])
              releaseByDs[dsId] = {
                resources: consumed.map((resource) =>
                  resource.resource_type === 'application'
                    ? releaseResource({
                        resource_type: 'application',
                        global_id: resource.resource_id,
                        version_id: `${dsId}:${resource.resource_id}`
                      })
                    : releaseResource({
                        resource_type: resource.resource_type,
                        resource_id: resource.resource_id,
                        version_id: `${dsId}:${resource.resource_id}`
                      })
                )
              }
            })
            return { dsIds, releaseByDs, resources }
          })
      }

      it('always returns a contract-valid, deployment_id-deduped union', () => {
        fc.assert(
          fc.asyncProperty(scenarioArb(), async (scenario) => {
            const result = await makeResolver(scenario)(scenario.resources)

            assertConsumingDeploymentsShape(result)

            const ids = result.deployments.map((deployment) => deployment.deploymentId)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)

            for (const dsId of result.matchedByDeployment.keys()) {
              expect(scenario.dsIds).toContain(dsId)
              expect(uniqueIds.has(dsId)).toBe(true)
            }

            expect(uniqueIds).toEqual(new Set(result.matchedByDeployment.keys()))

            return true
          }),
          { numRuns: NUM_RUNS }
        )
      })
    }
  )
}

runConsumingDeploymentsContract({
  name: 'fanoutResolver',
  makeResolver: (scenario) => createFanoutResolver(fanoutServicesFor(scenario))
})

runConsumingDeploymentsContract({
  name: 'resourceUsageResolver',
  makeResolver: (scenario) => createResourceUsageResolver(resourceUsageServicesFor(scenario))
})
