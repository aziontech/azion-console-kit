import * as RealTimeEventsService from '@/services/real-time-events-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsRoutes = {
  path: '/real-time-events/:tab?',
  name: 'real-time-events',
  component: () => import('@/views/RealTimeEvents/TabsView.vue'),
  props: {
    httpRequests: {
      listService: RealTimeEventsService.listHttpRequest,
      loadService: RealTimeEventsService.loadHttpRequest
    },
    edgeFunctions: {
      listService: RealTimeEventsService.listEdgeFunctions,
      loadService: RealTimeEventsService.loadEdgeFunctions
    },
    edgeFunctionsConsole: {
      listService: RealTimeEventsService.listEdgeFunctionsConsole,
      loadService: RealTimeEventsService.loadEdgeFunctionsConsole
    },
    imageProcessor: {
      listService: RealTimeEventsService.listImageProcessor,
      loadService: RealTimeEventsService.loadImageProcessor
    },
    tieredCache: {
      listService: RealTimeEventsService.listTieredCache,
      loadService: RealTimeEventsService.loadTieredCache
    },
    edgeDNS: {
      listService: RealTimeEventsService.listEdgeDNS,
      loadService: RealTimeEventsService.loadEdgeDNS
    },
    dataStream: {
      listService: RealTimeEventsService.listDataStream,
      loadService: RealTimeEventsService.loadDataStream
    },
    activityHistory: {
      listService: RealTimeEventsService.listActivityHistory,
      loadService: RealTimeEventsService.loadActivityHistory
    },
    edgePulse: {
      listService: RealTimeEventsService.listEdgePulse
    },
    loadFieldsData: RealTimeEventsService.loadFieldsEventsData,
    getTotalRecords: RealTimeEventsService.getTotalRecords
  },
  meta: {
    title: 'Real-Time Events',
    breadCrumbs: [
      {
        label: 'Real-Time Events',
        to: '/real-time-events'
      }
    ]
  }
}
