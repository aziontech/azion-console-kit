import GROUP_DASHBOARDS from './constants/dashboards'

export const fetchMetricsProductsService = async (groupValue) => {
  if (!groupValue) {
    return Promise.resolve([])
  }
  const dashboads = GROUP_DASHBOARDS.find((group) => group.value === groupValue).pagesDashboards

  const products = dashboads.map((dashboard) => {
    return {
      id: dashboard.id,
      label: dashboard.label,
      groupId: dashboard.groupId,
      path: dashboard.url
    }
  })

  return Promise.resolve(products)
}
