import * as Helpers from '@/helpers'
import * as RealTimeEventsService from '@/services/real-time-events-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:tab?',
  name: 'real-time-events',
  component: () => import('@/views/RealTimeEvents/TabsView.vue'),
  props: {
    playgroundOpener: Helpers.eventsPlaygroundOpener,
    httpRequests: {
      listHttpRequest: RealTimeEventsService.listHttpRequest,
      loadHttpRequest: RealTimeEventsService.loadHttpRequest,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsHttpRequest
    },
    edgeFunctions: {
      listEdgeFunctions: RealTimeEventsService.listEdgeFunctions,
      loadEdgeFunctions: RealTimeEventsService.loadEdgeFunctions,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsEdgeFunctions
    },
    edgeFunctionsConsole: {
      listEdgeFunctionsConsole: RealTimeEventsService.listEdgeFunctionsConsole,
      loadEdgeFunctionsConsole: RealTimeEventsService.loadEdgeFunctionsConsole,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsEdgeFunctionsConsole
    },
    imageProcessor: {
      listImageProcessor: RealTimeEventsService.listImageProcessor,
      loadImageProcessor: RealTimeEventsService.loadImageProcessor,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsImageProcessor
    },
    tieredCache: {
      listTieredCache: RealTimeEventsService.listTieredCache,
      loadTieredCache: RealTimeEventsService.loadTieredCache,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsTieredCache,
      clipboardWrite: Helpers.clipboardWrite
    },
    edgeDNS: {
      listEdgeDNS: RealTimeEventsService.listEdgeDNS,
      loadEdgeDNS: RealTimeEventsService.loadEdgeDNS,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsEdgeDNS
    },
    dataStream: {
      listDataStream: RealTimeEventsService.listDataStream,
      loadDataStream: RealTimeEventsService.loadDataStream,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsDataStream
    },
    activityHistory: {
      listActivityHistory: RealTimeEventsService.listActivityHistory,
      loadActivityHistory: RealTimeEventsService.loadActivityHistory,
      documentationService: Helpers.documentationGuideProducts.realTimeEventsActivityHistory
    }
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Real-Time Events',
        to: '/real-time-events'
      }
    ]
  }
}
