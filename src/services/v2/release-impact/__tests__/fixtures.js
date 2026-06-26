/**
 * Reusable fixtures for the release-impact layer (HOP 2/3).
 *
 * These mirror the EXACT shapes the impact data layer consumes from the
 * existing tenant services — no invented fields:
 *
 *  - Workloads list: the transformed list item produced by
 *    `WorkloadAdapter.transformListWorkloads` and surfaced by
 *    `workloadService.useWorkloadsListQuery` / `listWorkloads` as `{ body, count }`.
 *    Each item carries `active: { content: 'Active' | 'Inactive', severity }`
 *    and `bindings: [{ deployment_id, environment_id, domains[] }]` — the three
 *    guaranteed binding fields the reverse-lookup is allowed to read
 *    (design §3.2, req 3.2). `certificate` / `auto_domain_allow_access` MAY also
 *    be present on a raw binding but the reverse-lookup must ignore them.
 *
 *  - Environments list: the transformed item produced by
 *    `EnvironmentAdapter.transformList` and surfaced by
 *    `environmentService.useEnvironmentsListQuery` as `{ body, count }`.
 *    Only `{ id, name }` are relevant to HOP 3 (req 4.1).
 *
 * Consumers (tasks 3.x / 5.x / 6.x) read `.body` / `.count`, so the fixtures
 * expose both the raw arrays and the `{ body, count }` query-response wrappers.
 */

/** Wrap a list in the `{ body, count }` shape the v2 list services return. */
export const asListResponse = (body) => ({ body, count: body.length })

/**
 * Build a single transformed workload list item.
 *
 * @param {object} opts
 * @param {string|number} opts.id
 * @param {string} [opts.name]
 * @param {'Active'|'Inactive'} [opts.activeContent='Active']
 * @param {Array<{deployment_id:(string|number|null), environment_id:(string|number|null), domains:string[]}>} [opts.bindings=[]]
 */
export const makeWorkload = ({
  id,
  name = `Workload ${id}`,
  activeContent = 'Active',
  bindings = []
}) => ({
  id,
  name: { text: name, tagProps: {} },
  active:
    activeContent === 'Active'
      ? { content: 'Active', severity: 'success' }
      : { content: 'Inactive', severity: 'danger' },
  bindings
})

/** Build a binding using only the three guaranteed list-response fields. */
export const makeBinding = ({ deployment_id, environment_id, domains = [] }) => ({
  deployment_id,
  environment_id,
  domains
})

/**
 * (a) A v6 workloads list response.
 *
 * Covers: active + inactive workloads, multi-binding workloads, a binding with
 * a null `deployment_id` (must be skipped), an environment_id absent from the
 * environments map (env name must stay null — never fabricated), and two
 * workloads bound to the same deployment (aggregation across workloads).
 */
export const v6WorkloadsList = asListResponse([
  makeWorkload({
    id: 'wl-1',
    name: 'Storefront',
    activeContent: 'Active',
    bindings: [
      makeBinding({
        deployment_id: 'ds-1',
        environment_id: 'env-prod',
        domains: ['shop.example.com']
      }),
      makeBinding({
        deployment_id: 'ds-2',
        environment_id: 'env-stg',
        domains: ['stg.shop.example.com', 'preview.shop.example.com']
      })
    ]
  }),
  makeWorkload({
    id: 'wl-2',
    name: 'Checkout',
    activeContent: 'Active',
    bindings: [
      makeBinding({
        deployment_id: 'ds-1',
        environment_id: 'env-prod',
        domains: ['pay.example.com']
      })
    ]
  }),
  makeWorkload({
    id: 'wl-3',
    name: 'Disabled API',
    activeContent: 'Inactive',
    bindings: [
      makeBinding({
        deployment_id: 'ds-1',
        environment_id: 'env-prod',
        domains: ['api.example.com']
      })
    ]
  }),
  makeWorkload({
    id: 'wl-4',
    name: 'Marketing site',
    activeContent: 'Active',
    bindings: [
      // null deployment_id => not attributable to any DS, must be skipped.
      makeBinding({
        deployment_id: null,
        environment_id: 'env-prod',
        domains: ['mkt.example.com']
      }),
      // environment_id with no entry in the env map => environmentName stays null.
      makeBinding({
        deployment_id: 'ds-3',
        environment_id: 'env-orphan',
        domains: ['promo.example.com']
      })
    ]
  })
])

/**
 * (b) A legacy tenant: workloads exist but carry no v6 bindings.
 *
 * The reverse-lookup yields an empty index, which drives
 * `degradationReason='legacy_no_bindings'` downstream (req 3.5, 7.4).
 */
export const legacyWorkloadsList = asListResponse([
  makeWorkload({ id: 'wl-legacy-1', name: 'Legacy A', activeContent: 'Active', bindings: [] }),
  makeWorkload({ id: 'wl-legacy-2', name: 'Legacy B', activeContent: 'Active', bindings: [] })
])

/**
 * (c) An environments list of `{ id, name }`.
 *
 * `env-orphan` is intentionally NOT present so consumers can assert that an
 * unknown environment resolves to a null name (req 4.2, 7.3).
 */
export const environmentsList = asListResponse([
  { id: 'env-prod', name: 'Production' },
  { id: 'env-stg', name: 'Staging' }
])

/** `Map<environment_id, environment_name>` (HOP 3 output, req 4.1). */
export const envNameById = new Map(environmentsList.body.map((env) => [env.id, env.name]))
