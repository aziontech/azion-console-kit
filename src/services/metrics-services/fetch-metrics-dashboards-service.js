import GROUP_DASHBOARDS from './constants/dashboards'

export const fetchMetricsDashboardsService = async (groupId, productId) => {
  if (!productId || !groupId) {
    return Promise.resolve([])
  }

  const { pagesDashboards } = GROUP_DASHBOARDS.find((group) => group.id == groupId)

  const products = pagesDashboards.filter((product) => product.id == productId)

  if (!products.length) {
    return Promise.resolve([])
  }

  const dashboards = products[0].dashboards.map((dashboard) => {
    return {
      id: dashboard.id,
      label: dashboard.label,
      dataset: dashboard.dataset
    }
  })

  return Promise.resolve(dashboards)
}
