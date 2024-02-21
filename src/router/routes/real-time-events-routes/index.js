import * as Helpers from '@/helpers'
import * as RealTimeEventsService from '@/services/real-time-events-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:tab?',
  name: 'real-time-events',
  component: () => import('@/views/RealTimeEvents/TabsView.vue'),
  props: {
    playgroundOpener: Helpers.metricsPlaygroundOpener,
    httpRequests: {
      listHttpRequest: RealTimeEventsService.listHttpRequest,
      loadHttpRequest: RealTimeEventsService.loadHttpRequest,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    edgeFunctions: {
      listEdgeFunctions: RealTimeEventsService.listEdgeFunctions,
      loadEdgeFunctions: RealTimeEventsService.loadEdgeFunctions,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    edgeFunctionsConsole: {
      listEdgeFunctionsConsole: RealTimeEventsService.listEdgeFunctionsConsole,
      loadEdgeFunctionsConsole: RealTimeEventsService.loadEdgeFunctionsConsole,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    imageProcessor: {
      listImageProcessor: RealTimeEventsService.listImageProcessor,
      loadImageProcessor: RealTimeEventsService.loadImageProcessor,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    l2Cache: {
      listL2Cache: RealTimeEventsService.listL2Cache,
      loadL2Cache: RealTimeEventsService.loadL2Cache,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents,
      clipboardWrite: Helpers.clipboardWrite
    },
    intelligentDNS: {
      listIntelligentDNS: RealTimeEventsService.listIntelligentDNS,
      loadIntelligentDNS: RealTimeEventsService.loadIntelligentDNS,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    dataStreaming: {
      listDataStreaming: RealTimeEventsService.listDataStreaming,
      loadDataStreaming: RealTimeEventsService.loadDataStreaming,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
    },
    activityHistory: {
      listActivityHistory: RealTimeEventsService.listActivityHistory,
      loadActivityHistory: RealTimeEventsService.loadActivityHistory,
      documentationService: Helpers.documentationGuideProducts.realTimeEvents
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
