import * as EdgeNodeService from '@/services/edge-node-services'
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
        listEdgeNodeService: EdgeNodeService.listEdgeNodeService,
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
      path: 'edit/:id',
      name: 'edit-edge-node',
      component: () => import('@views/EdgeNode/EditView.vue'),
      props: {
        loadEdgeNodeService: EdgeNodeService.loadEdgeNodeService,
        editEdgeNodeService: EdgeNodeService.editEdgeNodeService,
        listServiceEdgeNodeService: ServiceEdgeNode.listServiceEdgeNodeService,
        updatedRedirect: 'list-edge-node'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Nodes',
            to: '/edge-node'
          },
          {
            label: 'Edit Edge Node'
          }
        ]
      }
    },
    {
      path: 'edit/:id/service',
      name: 'edit-edge-node-service',
      component: () => import('@views/EdgeNode/EditView.vue'),
      props: {
        loadEdgeNodeService: EdgeNodeService.loadEdgeNodeService,
        editEdgeNodeService: EdgeNodeService.editEdgeNodeService,
        listServiceEdgeNodeService: ServiceEdgeNode.listServiceEdgeNodeService,
        deleteEdgeNodeService: ServiceEdgeNode.deleteEdgeNodeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Services',
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
