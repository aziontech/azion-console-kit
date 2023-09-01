import * as EdgeServicesService from '@/services/edge-services-services';

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeServicesRoutes = {
  path: '/edge-services',
  name: 'edge-services',
  children: [
    {
      path: '',
      name: 'list-edge-services',
      component: () => import('@views/EdgeServices/ListView.vue'),
      props: {
        listEdgeServicesService: EdgeServicesService.listEdgeServicesService,
        deleteEdgeServicesService: EdgeServicesService.deleteEdgeServicesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          }
        ]
      }
    }
  ]
};