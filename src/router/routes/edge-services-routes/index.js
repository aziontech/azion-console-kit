import * as EdgeServicesService from '@/services/edge-services-services'
import * as Helpers from '@/helpers'
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
        deleteEdgeServicesService: EdgeServicesService.deleteEdgeServicesService,
        documentationService: Helpers.documentationCatalog.edgeServices
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-services',
      component: () => import('@views/EdgeServices/CreateView.vue'),
      props: {
        createEdgeService: EdgeServicesService.createEdgeServiceService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          },
          {
            label: 'Create Edge Service',
            to: '/edge-services/create'
          }
        ]
      }
    }
  ]
}
