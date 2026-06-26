/**
 * HOP 1 — consuming-deployments resolution: public interface + strategy
 * selector.
 *
 * `resolveConsumingDeployments(resources)` is the ONE interface every caller
 * depends on (req 1.2). Its concrete strategy is chosen by `selectResolver()`,
 * which **today always returns `fanoutResolver`** — no feature flag, no
 * capability probe, no auth gate (design §3.4 / §7.1). When the `resource-usage`
 * endpoint is delivered, swapping to `resourceUsageResolver` is a single-line
 * change in `selectResolver()` and touches no caller (req 1.4 / 8.3); that
 * `resourceUsageResolver` is a deferred task (tasks.md "Deferred", D1).
 *
 * The output shape, the 1..N normalisation, and the match rule live in
 * `./contract.js` so every strategy honours the same contract (Property 3 is
 * written against it and is reusable for the future resolver).
 */

import { createFanoutResolver } from './fanout-resolver'

/**
 * Select the active HOP 1 strategy.
 *
 * Always returns the fan-out resolver. To activate the `resource-usage`
 * endpoint later, return `createResourceUsageResolver(...)` here instead — the
 * deliberate one-line flip (req 1.4 / 8.3). Dependencies are taken as a factory
 * argument so callers/tests can inject fakes without a Vue context.
 *
 * @param {object} [deps] - injected dependencies forwarded to the strategy.
 * @returns {import('./contract').ResolveConsumingDeployments}
 */
export const selectResolver = (deps) => createFanoutResolver(deps)

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
