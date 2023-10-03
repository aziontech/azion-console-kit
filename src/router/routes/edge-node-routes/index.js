import * as EdgeNodeService from '@/services/edge-node-services'
import * as ServiceEdgeNode from '@/services/edge-node-service-services'

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
        authorizeEdgeNodeService: EdgeNodeService.authorizeEdgeNodeService
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
        listServiceEdgeNodeService: ServiceEdgeNode.listServiceEdgeNodeService
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
    },
    {
      path: 'edit/:id/service/add',
      name: 'add-service-edge-node',
      component: () => import('@/views/EdgeNode/AddServiceEdgeNodeView.vue'),
      props: {
        listServiceEdgeNodeService: ServiceEdgeNode.listServiceEdgeNodeService,
        addEdgeNodeService: ServiceEdgeNode.addEdgeNodeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Service',
            to: '/edit/:id/service'
          },
          {
            label: 'Add Service'
          }
        ]
      }
    },
    {
      path: 'edit/:id/service/:id',
      name: 'edit-service-edge-node',
      component: () => import('@/views/EdgeNode/EditServiceEdgeNodeView.vue'),
      props: {
        loadServiceEdgeNodeService: ServiceEdgeNode.loadServiceEdgeNodeService,
        editEdgeNodeService: ServiceEdgeNode.editEdgeNodeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Service',
            to: '/edit/:id/service'
          },
          {
            label: 'Edit Service'
          }
        ]
      }
    }
  ]
}
