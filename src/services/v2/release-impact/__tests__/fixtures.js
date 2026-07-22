export const asListResponse = (body) => ({ body, count: body.length })

/**
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

export const makeBinding = ({ deployment_id, environment_id, domains = [] }) => ({
  deployment_id,
  environment_id,
  domains
})

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
      makeBinding({
        deployment_id: null,
        environment_id: 'env-prod',
        domains: ['mkt.example.com']
      }),
      makeBinding({
        deployment_id: 'ds-3',
        environment_id: 'env-orphan',
        domains: ['promo.example.com']
      })
    ]
  })
])

export const legacyWorkloadsList = asListResponse([
  makeWorkload({ id: 'wl-legacy-1', name: 'Legacy A', activeContent: 'Active', bindings: [] }),
  makeWorkload({ id: 'wl-legacy-2', name: 'Legacy B', activeContent: 'Active', bindings: [] })
])

export const environmentsList = asListResponse([
  { id: 'env-prod', name: 'Production' },
  { id: 'env-stg', name: 'Staging' }
])

export const envNameById = new Map(environmentsList.body.map((env) => [env.id, env.name]))
