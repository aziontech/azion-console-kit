import GROUP_DASHBOARDS from './constants/dashboards'

export const fetchMetricsGroupsService = async () => {
  const groups = GROUP_DASHBOARDS.map((group) => {
    return {
      label: group.label,
      value: group.value,
      id: group.id
    }
  })

  return Promise.resolve(groups)
}
