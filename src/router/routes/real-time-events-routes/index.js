import { metricsPlaygroundOpener } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:pageId?/:dashboardId?',
  name: 'real-time-events',
  component: () => import('@views/RealTimeEvents/TabsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Events',
        to: '/events'
      }
    ]
  }
}
