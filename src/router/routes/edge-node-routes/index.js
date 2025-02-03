import * as EdgeNodeService from '@/services/edge-node-services'
import * as EdgeNodeServiceV4 from '@/services/edge-node-services/v4'
import * as ServiceEdgeNode from '@/services/edge-node-service-services'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeNodeRoutes = {
  path: '/edge-node',
  name: 'edge-node',
  children: [
    {
      path: '',
      name: 'list-edge-node',
      component: () => import('@views/EdgeNode/ListView.vue'),
      props: {
        listEdgeNodeService: EdgeNodeServiceV4.listEdgeNodeService,
        deleteEdgeNodeService: EdgeNodeService.deleteEdgeNodeService,
        documentationService: Helpers.documentationCatalog.edgeNodes
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Node',
            to: '/edge-node'
          }
        ]
      }
    },
    {
      path: 'edit/:id/:services?',
      name: 'edit-edge-node',
      component: () => import('@/views/EdgeNode/TabsView.vue'),
      props: {
        loadEdgeNodeService: EdgeNodeService.loadEdgeNodeService,
        editEdgeNodeService: EdgeNodeService.editEdgeNodeService,
        listGroupsEdgeNodeService: EdgeNodeService.listGroupsEdgeNodeService,
        listServiceEdgeNodeService: ServiceEdgeNode.listServiceEdgeNodeService,
        deleteServiceEdgeNodeService: ServiceEdgeNode.deleteServiceEdgeNodeService,
        createServiceEdgeNodeService: ServiceEdgeNode.createServiceEdgeNodeService,
        loadServiceEdgeNodeService: ServiceEdgeNode.loadServiceEdgeNodeService,
        editServiceEdgeNodeService: ServiceEdgeNode.editServiceEdgeNodeService,
        documentationServiceServices: Helpers.documentationCatalog.edgeServices,
        updatedRedirect: 'list-edge-node'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Node',
            to: '/edge-node'
          },
          {
            label: 'Edit Edge Node'
          }
        ]
      }
    }
  ]
}
