import * as EdgeServiceServices from '@/services/edge-service-services'
import * as EdgeServiceResourcesServices from '@/services/edge-service-resources-services'
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
        listEdgeServiceServices: EdgeServiceServices.listEdgeServiceServices,
        deleteEdgeServiceServices: EdgeServiceServices.deleteEdgeServiceServices,
        editEdgeServiceServices: EdgeServiceServices.editEdgeServiceServices,
        documentationService: Helpers.documentationCatalog.edgeServices
      },
      meta: {
        title: 'Edge Services',
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
        createEdgeServiceServices: EdgeServiceServices.createEdgeServiceServices
      },
      meta: {
        title: 'Create Edge Service',
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          },
          {
            label: 'Create',
            to: '/edge-services/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:resources?',
      name: 'edit-edge-services',
      component: () => import('@/views/EdgeServices/TabsView.vue'),
      props: {
        loadEdgeService: EdgeServiceServices.loadEdgeServiceServices,
        editEdgeService: EdgeServiceServices.editEdgeServiceServices,
        listResourcesServices: EdgeServiceResourcesServices.listResourcesServices,
        deleteResourcesServices: EdgeServiceResourcesServices.deleteResourcesServices,
        editResourcesServices: EdgeServiceResourcesServices.editResourcesServices,
        createResourcesServices: EdgeServiceResourcesServices.createResourcesServices,
        loadResourcesServices: EdgeServiceResourcesServices.loadResourcesServices,
        documentationServiceResource: Helpers.documentationGuideProducts.edgeServicesResources,
        updatedRedirect: 'list-edge-services'
      },
      meta: {
        title: 'Edit Edge Service',
        breadCrumbs: [
          {
            label: 'Edge Services',
            to: '/edge-services'
          },
          {
            label: 'Edit Edge Service',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
