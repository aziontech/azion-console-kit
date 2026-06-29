/**
 * HOP 1 — consuming-deployments resolution: public interface + strategy
 * selector.
 *
 * `resolveConsumingDeployments(resources)` is the ONE interface every caller
 * depends on (req 1.2). Its concrete strategy is chosen by `selectResolver()`,
 * which returns a COMPOSED resolver: it tries the authoritative tenant-scoped
 * `GET /v4/resource_usage` endpoint (`resourceUsageResolver`) and, on ANY
 * failure (endpoint not live, transport error, etc.), falls back to the
 * contract-equal client-side `fanoutResolver` (list DS + scan each active
 * release, ≤50). Both honour the same contract (Property 3), so the fallback is
 * transparent to every caller (req 1.4 / 8.3) and the candidate set populates
 * with or without the endpoint.
 *
 * The output shape, the 1..N normalisation, and the match rule live in
 * `./contract.js` so every strategy honours the same contract (Property 3 is
 * written against it and is reusable for the future resolver).
 */

import { createResourceUsageResolver } from './resource-usage-resolver'
import { createFanoutResolver } from './fanout-resolver'

/**
 * Select the active HOP 1 strategy: a composed resolver that prefers the
 * `resource-usage` endpoint and degrades to the client-side fan-out so the
 * candidate set populates with OR without the endpoint being live.
 *
 * The deployment-api `GET /v4/resource_usage` endpoint is the authoritative
 * source, but it may not be live in every environment. Two failure modes are
 * handled so an unreachable endpoint never blocks the picker (an empty candidate
 * set hides every row):
 *
 *   1. The primary THROWS (defensive — a factory/wiring error before the
 *      resolver's internal `allSettled`): caught and re-resolved via the fan-out.
 *   2. The primary resolves EMPTY: the resource-usage resolver swallows transport
 *      errors internally and never rejects (contract req 1.6), so a failed call
 *      is indistinguishable from a genuine empty from the outside. Re-resolve via
 *      the contract-equal fan-out: on a swallowed failure it recovers the real
 *      candidates, and on a GENUINE empty it returns the same empty (same tenant
 *      inventory, same match rule) — so the distinction is preserved either way.
 *
 * Both strategies satisfy {@link import('./contract').ResolveConsumingDeployments}.
 * Dependencies are a factory argument so callers/tests can inject fakes without a
 * Vue context; the fan-out's services are taken from the SAME `deps` bag (it
 * reads `deploymentService` / `deploymentReleaseService`), so a test can force the
 * fallback by injecting a throwing `resourceUsageService` alongside fake
 * deployment services.
 *
 * @param {object} [deps] - injected dependencies forwarded to both strategies.
 * @returns {import('./contract').ResolveConsumingDeployments}
 */
export const selectResolver = (deps) => {
  const primary = createResourceUsageResolver(deps)
  const fallback = createFanoutResolver(deps)
  return async (resources) => {
    let primaryResult = null
    try {
      primaryResult = await primary(resources)
    } catch {
      primaryResult = null
    }
    if (primaryResult && primaryResult.deployments.length > 0) {
      return primaryResult
    }
    // Empty or failed primary → degrade to the contract-equal fan-out.
    return fallback(resources)
  }
}

/**
 * Resolve the deployments consuming the given resource(s) through the active
 * HOP 1 strategy. Single stable signature for all callers (req 1.2).
 *
 * @param {import('./contract').ResourceRef|import('./contract').ResourceRef[]} resources -
 *   one or many resource refs (req 6.1).
 * @param {object} [deps] - injected dependencies forwarded to `selectResolver`.
 * @returns {Promise<import('./contract').ConsumingDeploymentsResult>} the
 *   de-duplicated union of consuming deployments with the per-DS match map
 *   (req 1.7); the empty result when nothing matches, never a rejection (req 1.6).
 */
export const resolveConsumingDeployments = (resources, deps) => selectResolver(deps)(resources)

export {
  APPLICATION_RESOURCE_TYPE,
  resourceKey,
  matchFieldFor,
  normalizeResources,
  emptyResult,
  assertConsumingDeploymentsShape
} from './contract'

export { createFanoutResolver, fanoutResolver, FANOUT_PRESELECT_DS_CAP } from './fanout-resolver'
export { createResourceUsageResolver, resourceUsageResolver } from './resource-usage-resolver'
