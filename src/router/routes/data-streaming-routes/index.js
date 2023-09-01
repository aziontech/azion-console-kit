import * as DataStreamingService from '@/services/data-streaming-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const dataStreamingRoutes = {
  path: '/data-streaming',
  name: 'data-streaming',
  children: [
    {
      path: '',
      name: 'list-data-streaming',
      component: () => import('@views/DataStreaming/ListView.vue'),
      props: {
        listDataStreamingService: DataStreamingService.listDataStreamingService,
        deleteDataStreamingService: DataStreamingService.deleteDataStreamingService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Data Streaming',
            to: '/data-streaming'
          }
        ]
      }
    }
  ]
}
