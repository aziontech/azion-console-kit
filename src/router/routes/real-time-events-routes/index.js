import * as Helpers from '@/helpers'
import BeholderEventsGQL from '@/services/real-time-events-service/beholder-events'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:tab?',
  name: 'real-time-events',
  component: () => import('@views/RealTimeEvents/EventsView.vue'),
  props: {
    playgroundOpener: Helpers.metricsPlaygroundOpener,
    BeholderEventsGQL,
    httpRequests: {
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
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
        to: '/real-time-events'
      }
    ]
  }
}
