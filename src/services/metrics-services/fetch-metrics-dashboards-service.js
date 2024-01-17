import GROUP_DASHBOARDS from './constants/dashboards'

export const fetchMetricsDashboardsService = async (groupPath, productPath) => {
  if (!productPath || !groupPath) {
    return Promise.resolve([])
  }

  const { pagesDashboards } = GROUP_DASHBOARDS.find((group) => group.value == groupPath)

  const products = pagesDashboards.filter((product) => product.url == productPath)

  if (!products.length) {
    return Promise.resolve([])
  }

  const dashboards = products[0].dashboards.map((dashboard) => {
    return {
      id: dashboard.id,
      label: dashboard.label,
      dataset: dashboard.dataset,
      path: dashboard.url
    }
  })

  return Promise.resolve(dashboards)
}
