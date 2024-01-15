import { metricsPlaygroundOpener } from '@/helpers'
import * as MetricsServices from '@/services/metrics-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const metricsRoutes = {
  path: '/metrics/:pageId?/:dashboardId?',
  name: 'metrics',
  component: () => import('@views/Metrics/MetricsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener,
    fetchDataFromBeholderService: MetricsServices.fetchDataFromBeholderService,
    searchDomainsMetricsService: MetricsServices.searchDomainsMetricsService,
    fetchMetricsGroupsService: MetricsServices.fetchMetricsGroupsService,
    fetchMetricsProductsService: MetricsServices.fetchMetricsProductsService
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
