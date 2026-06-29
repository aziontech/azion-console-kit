/**
 * Property 3 — `resolveConsumingDeployments` interface contract (task 9.3).
 *
 * Every HOP 1 strategy MUST honour the same output contract so `selectResolver()`
 * can swap one for another without touching any caller (req 1.2 / 1.4 / 8.3 — the
 * Liskov guarantee). This suite verifies that contract:
 *
 *   - SHAPE: the result satisfies {@link assertConsumingDeploymentsShape} —
 *     `{ deployments: ConsumingDeployment[], matchedByDeployment: Map }`, every
 *     deployment carries a `deploymentId` + `activeVersionByResource` object, and
 *     every match-map key has a corresponding deployment.
 *   - UNION DE-DUP by `deployment_id` (req 1.7): a deployment that consumes more
 *     than one of the requested resources appears EXACTLY ONCE in `deployments`,
 *     with all its matched resources collected under `matchedByDeployment`.
 *   - EMPTY (req 1.6): no match resolves to the empty result, never a rejection.
 *
 * REUSABILITY (task 9.3 acceptance): the contract is encoded as a single
 * exported runner — {@link runConsumingDeploymentsContract} — driven entirely by
 * a `makeResolver(scenario)` factory the caller supplies. `fanoutResolver` is run
 * through it below; when the `resource-usage` endpoint is delivered (deferred D1),
 * `resourceUsageResolver` is added by calling the SAME runner with a resolver
 * built from the same scenario — no contract assertion is duplicated or changed.
 *
 * Validates requirements 1.2, 1.7, 8.3.
 *
 * fast-check is NOT yet a devDependency of this repo (see spec task 1.2
 * blockers). The PBT layer loads it lazily and SKIPS with a clear reason when it
 * is absent; the example-based contract assertions always run, so the contract
 * is verified today regardless.
 */
import { describe, it, expect } from 'vitest'
import { createFanoutResolver } from './fanout-resolver'
import { createResourceUsageResolver } from './resource-usage-resolver'
import { assertConsumingDeploymentsShape, resourceKey } from './contract'

// ---------------------------------------------------------------------------
// fast-check (optional today) — loaded lazily so the file stays importable.
// ---------------------------------------------------------------------------
let fc = null
try {
  fc = (await import('fast-check')).default
} catch {
  fc = null
}
const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Scenario builders — describe a tenant's deployments + active releases purely
// as data, so any strategy can be wired against the SAME scenario.
// ---------------------------------------------------------------------------

/** Wrap a DS-id list in the `{ body, count }` shape the DS list service returns. */
const dsListResponse = (ids) => ({ body: ids.map((id) => ({ id })), count: ids.length })

/**
 * A self-contained scenario: the DS inventory + each DS's active release
 * `resources[]`, plus the resource refs to resolve and the expected union.
 *
 * @typedef {object} ContractScenario
 * @property {string[]} dsIds - the DS inventory the strategy lists.
 * @property {Object<string, {resources: object[]}>} releaseByDs - active release per DS.
 * @property {Array<{resource_type:string, resource_id:(string|number)}>} resources - refs to resolve.
 */

/**
 * Build the tenant services a fan-out strategy needs from a scenario. This is the
 * fan-out-specific adapter; a future `resourceUsageResolver` supplies its own
 * `makeResolver` (a single mocked endpoint) over the SAME scenario object.
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

// Drive the resource-usage resolver from the SAME ContractScenario: the fake
// `listResourceUsage` derives the endpoint's per-deployment rows from each DS's
// active release (single-type per call, `application` matched by `global_id`).
const resourceUsageServicesFor = (scenario) => ({
  resourceUsageService: {
    listResourceUsage: ({ resourceType, resourceIds }) => {
      const wanted = new Set(resourceIds.map(String))
      const rows = scenario.dsIds
        .map((dsId) => {
          const releaseResources = scenario.releaseByDs[dsId]?.resources ?? []
          const matched = releaseResources.filter((resource) => {
            if (resource.resource_type !== resourceType) return false
            const idField =
              resourceType === 'application' ? resource.global_id : resource.resource_id
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

/** A release resource entry keyed the way the active release surfaces it. */
const releaseResource = ({ resource_type, resource_id, global_id, version_id }) => ({
  resource_type,
  ...(resource_id != null ? { resource_id } : {}),
  ...(global_id != null ? { global_id } : {}),
  version_id
})

// ---------------------------------------------------------------------------
// The reusable contract runner — the deliverable of task 9.3.
// ---------------------------------------------------------------------------

/**
 * Run a HOP 1 strategy through the interface contract (Property 3).
 *
 * Reused unchanged for the future `resourceUsageResolver`: pass a different
 * `name` and a `makeResolver` that builds that strategy from the same scenario
 * object. Every assertion here is shape/union/empty — never fan-out-specific —
 * so it stays valid for any LSP-compatible strategy.
 *
 * @param {object} cfg
 * @param {string} cfg.name - strategy name (test description prefix).
 * @param {(scenario: ContractScenario) => import('./contract').ResolveConsumingDeployments} cfg.makeResolver -
 *   builds a resolver bound to the given scenario.
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

    it('matches an `application` ref by `global_id` and carries its pinned version', async () => {
      const scenario = {
        dsIds: ['ds-1'],
        releaseByDs: {
          'ds-1': {
            resources: [
              // application: matched by global_id, NOT resource_id (req 1.5).
              releaseResource({
                resource_type: 'application',
                resource_id: '999',
                global_id: 'app-global-1',
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
      // ds-1 consumes BOTH requested resources; it must appear exactly once, with
      // both matches collected under matchedByDeployment (req 1.7).
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

      // Each consuming DS appears exactly once (de-dup by deploymentId).
      const ids = result.deployments.map((deployment) => deployment.deploymentId)
      expect(new Set(ids).size).toBe(ids.length)
      expect(new Set(ids)).toEqual(new Set(['ds-1', 'ds-2']))

      // ds-1 matched BOTH refs; the match map preserves which ones.
      const ds1Matches = result.matchedByDeployment.get('ds-1')
      expect(ds1Matches.map(resourceKey).sort()).toEqual(
        [resourceKey(appRef), resourceKey(fnRef)].sort()
      )

      // ds-1 pins a version per matched resource.
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

  // PBT layer: drive the SAME contract over generated scenarios. Skips cleanly
  // when fast-check is absent; the example-based suite above still verifies the
  // contract today.
  const describeOrSkip = fc ? describe : describe.skip
  const skipReason = fc
    ? ''
    : ' (SKIPPED: fast-check is not installed — see spec task 1.2 blockers)'

  describeOrSkip(
    `resolveConsumingDeployments contract — ${name} (Property 3, PBT)${skipReason}`,
    () => {
      // A scenario arbitrary: a DS inventory, a release per DS built from a subset
      // of the requested resources, and the resource refs to resolve.
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
            // For each DS, which subset of the requested resources it consumes.
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

            // Shape contract (throws on the first violation).
            assertConsumingDeploymentsShape(result)

            // Union de-dup by deploymentId (req 1.7) — assert independently of the
            // shape helper so a regression there can't mask this.
            const ids = result.deployments.map((deployment) => deployment.deploymentId)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)

            // Every matched DS exists in the inventory and is in the union.
            for (const dsId of result.matchedByDeployment.keys()) {
              expect(scenario.dsIds).toContain(dsId)
              expect(uniqueIds.has(dsId)).toBe(true)
            }

            // A DS is in the union IFF it has at least one match.
            expect(uniqueIds).toEqual(new Set(result.matchedByDeployment.keys()))

            return true
          }),
          { numRuns: NUM_RUNS }
        )
      })
    }
  )
}

// ---------------------------------------------------------------------------
// Strategy under contract today: fanoutResolver. The future resourceUsageResolver
// (deferred D1) is added by calling runConsumingDeploymentsContract again with a
// makeResolver that builds it from the same ContractScenario.
// ---------------------------------------------------------------------------
runConsumingDeploymentsContract({
  name: 'fanoutResolver',
  makeResolver: (scenario) => createFanoutResolver(fanoutServicesFor(scenario))
})

runConsumingDeploymentsContract({
  name: 'resourceUsageResolver',
  makeResolver: (scenario) => createResourceUsageResolver(resourceUsageServicesFor(scenario))
})
