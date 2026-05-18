import * as RealTimeEventsService from '@/services/real-time-events-service'
import * as RealTimeEventsServiceV2 from '@/views/RealTimeEventsV2/services'
import { loadEventsChartAggregation } from '@/services/real-time-events-service-v2/load-events-aggregation'

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

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimeEventsV2Routes = {
  path: '/real-time-events/v2/:tab?',
  name: 'real-time-events-v2',
  component: () => import('@/views/RealTimeEventsV2/TabsView.vue'),
  props: {
    httpRequests: {
      listService: RealTimeEventsServiceV2.listHttpRequest,
      loadService: RealTimeEventsServiceV2.loadHttpRequest
    },
    edgeFunctions: {
      listService: RealTimeEventsServiceV2.listEdgeFunctions,
      loadService: RealTimeEventsServiceV2.loadEdgeFunctions
    },
    edgeFunctionsConsole: {
      listService: RealTimeEventsServiceV2.listEdgeFunctionsConsole,
      loadService: RealTimeEventsServiceV2.loadEdgeFunctionsConsole
    },
    imageProcessor: {
      listService: RealTimeEventsServiceV2.listImageProcessor,
      loadService: RealTimeEventsServiceV2.loadImageProcessor
    },
    tieredCache: {
      listService: RealTimeEventsServiceV2.listTieredCache,
      loadService: RealTimeEventsServiceV2.loadTieredCache
    },
    edgeDNS: {
      listService: RealTimeEventsServiceV2.listEdgeDNS,
      loadService: RealTimeEventsServiceV2.loadEdgeDNS
    },
    dataStream: {
      listService: RealTimeEventsServiceV2.listDataStream,
      loadService: RealTimeEventsServiceV2.loadDataStream
    },
    activityHistory: {
      listService: RealTimeEventsServiceV2.listActivityHistory,
      loadService: RealTimeEventsServiceV2.loadActivityHistory
    },
    loadEventsChartAggregation
  },
  meta: {
    title: 'Real-Time Events (New)',
    breadCrumbs: [
      {
        label: 'Real-Time Events',
        to: '/real-time-events/v2'
      }
    ]
  }
}
