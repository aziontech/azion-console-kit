import { clipboardWrite, metricsPlaygroundOpener } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const metricsRoutes = {
  path: '/real-time-metrics/:pageId?/:dashboardId?',
  name: 'real-time-metrics',
  component: () => import('@views/Metrics/MetricsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener,
    clipboardWrite
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Metrics',
        to: '/real-time-metrics'
      }
    ]
  }
}
