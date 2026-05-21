import { computed } from 'vue'
import GROUP_DASHBOARDS from '@/modules/real-time-metrics/constants/dashboards'

/**
 * Composable that resolves Metrics dashboard IDs into labelled options
 * by flattening the GROUP_DASHBOARDS constant.
 *
 * Extracted from dashboard-panel.vue to keep the component thin.
 *
 * @param {import('vue').ComputedRef<string[]>} allowedIds – reactive list of dashboard IDs
 * @returns {{ metricsDashboardOptions: import('vue').ComputedRef<Array<{ id: string, label: string, dataset: string, path: string }>> }}
 */
export function useMetricsDashboardResolver(allowedIds) {
  const metricsDashboardOptions = computed(() => {
    const ids = allowedIds.value || []
    if (!ids.length) return []

    const allDashboards = []
    for (const group of GROUP_DASHBOARDS) {
      for (const page of group.pagesDashboards) {
        for (const dashboard of page.dashboards) {
          // Avoid redundant labels like "Threats Breakdown — Threats Breakdown"
          const label =
            page.label === dashboard.label ? dashboard.label : `${page.label} — ${dashboard.label}`
          allDashboards.push({
            id: dashboard.id,
            label,
            dataset: dashboard.dataset,
            path: dashboard.path
          })
        }
      }
    }

    // Return only the dashboards referenced by this panel, preserving the order from the config
    return ids
      .map((id) => allDashboards.find((dashboardItem) => dashboardItem.id === id))
      .filter(Boolean)
  })

  return { metricsDashboardOptions }
}
