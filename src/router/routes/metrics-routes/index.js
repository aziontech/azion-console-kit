import { metricsPlaygroundOpener } from '@/helpers'
import * as MetricsServices from '@/services/metrics-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const metricsRoutes = {
  path: '/real-time-metrics/:group?/:product?',
  name: 'real-time-metrics',
  component: () => import('@views/Metrics/MetricsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener,
    fetchDataFromBeholderService: MetricsServices.fetchDataFromBeholderService,
    searchDomainsMetricsService: MetricsServices.searchDomainsMetricsService,
    fetchMetricsGroupsService: MetricsServices.fetchMetricsGroupsService,
    fetchMetricsProductsService: MetricsServices.fetchMetricsProductsService,
    fetchMetricsDashboardsService: MetricsServices.fetchMetricsDashboardsService
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Metrics',
        to: '/metrics'
      }
    ]
  }
}
