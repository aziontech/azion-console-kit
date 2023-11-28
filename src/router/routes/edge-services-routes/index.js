import * as EdgeServicesService from '@/services/edge-services-service'
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
        editEdgeServicesService: EdgeServicesService.editEdgeServicesService,
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
        createEdgeService: EdgeServicesService.createEdgeServicesService
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
    },
    {
      path: 'edit/:id/:resources?',
      name: 'edit-edge-services',
      component: () => import('@views/EdgeServices/EditView.vue'),
      props: {
        loadEdgeService: EdgeServicesService.loadEdgeServicesService,
        editEdgeService: EdgeServicesService.editEdgeServicesService,

        createEdgeServicesResources: EdgeServicesService.createEdgeServicesResourcesService,
        loadEdgeServicesResources: EdgeServicesService.loadEdgeServicesResourcesService,
        editEdgeServicesResources: EdgeServicesService.editEdgeServicesResourcesService,
        listEdgeServicesResources: EdgeServicesService.listEdgeServicesResourcesService,
        deleteEdgeServicesResourcesService: EdgeServicesService.deleteEdgeServicesResourcesService,

        updatedRedirect: 'list-edge-services'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          },
          {
            label: 'Edit Edge Services'
          }
        ]
      }
    }
  ]
}
