import * as MetricsServices from '@/services/metrics-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const metricsRoutes = {
  path: '/metrics',
  name: '',
  children: [
    {
      path: '',
      name: 'metrics',
      component: () => import('@views/Metrics/MetricsView.vue'),
      props: {
        fetchDataFromBeholderService: MetricsServices.fetchDataFromBeholderService,
        searchDomainsMetricsService: MetricsServices.searchDomainsMetricsService
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
  ]
}
