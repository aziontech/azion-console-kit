import { metricsPlaygroundOpener } from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:tab?',
  name: 'real-time-events',
  component: () => import('@views/RealTimeEvents/TabsView.vue'),
  props: {
    playgroundOpener: metricsPlaygroundOpener,
    httpRequests: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    edgeFunctions: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    edgeFunctionsConsole: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    imageProcessor: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    l2Cache: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    intelligentDNS: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    dataStreaming: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    activityHistory: {
      documentationService: 'Helpers.documentationCatalog.edgeApplicationHTTPRequests'
    },
    clipboardWrite: 'Helpers.clipboardWrite'
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
