import * as MetricsServices from '@/services/metrics-services'
import * as DomainsServices from '@/services/domains-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const metricsRoutes = {
  path: '/metrics',
  name: '',
  children: [
    {
      path: '',
      name: 'metrics',
      component: () => import('@views/metrics/MetricsView'),
      props: {
        fetchDataFromBeholderService: MetricsServices.fetchDataFromBeholderService,
        searchDomainsMetricsService: DomainsServices.searchDomainsMetricsService,
        tabsReportsMetricsService: MetricsServices.fakeReportServices,
        dropdownReportsMetricsService: MetricsServices.fakeDropdownReportServices,
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
