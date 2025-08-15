import { clipboardWrite, metricsPlaygroundOpener } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeMetricsRoutes = {
  path: '/real-time-metrics/:pageId?/:dashboardId?',
  name: 'real-time-metrics',
  component: () => import('@views/RealTimeMetrics/RealTimeMetricsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener,
    clipboardWrite
  },
  meta: {
    title: 'Real-Time Metrics',
    breadCrumbs: [
      {
        label: 'Real-Time Metrics',
        to: '/real-time-metrics'
      }
    ]
  }
}
