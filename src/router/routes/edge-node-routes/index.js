import * as EdgeNodeService from '@/services/edge-node-services'
import * as ServiceEdgeNode from '@/services/edge-node-service-services'
import * as ServiceEdgeNodeV4 from '@/services/edge-node-service-services/v4'
import * as Helpers from '@/helpers'
import * as EdgeServiceServices from '@/services/edge-service-services'

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
      path: 'edit/:id/:services?',
      name: 'edit-edge-node',
      component: () => import('@/views/EdgeNode/TabsView.vue'),
      props: {
        loadEdgeNodeService: EdgeNodeService.loadEdgeNodeService,
        editEdgeNodeService: EdgeNodeService.editEdgeNodeService,

        listGroupsEdgeNodeService: EdgeNodeService.listGroupsEdgeNodeService,

        listServiceEdgeNodeService: ServiceEdgeNodeV4.listServiceEdgeNodeService,
        deleteServiceEdgeNodeService: ServiceEdgeNode.deleteServiceEdgeNodeService,
        loadServiceEdgeNodeService: ServiceEdgeNode.loadServiceEdgeNodeService,
        editServiceEdgeNodeService: ServiceEdgeNode.editServiceEdgeNodeService,

        listEdgeServiceServices: EdgeServiceServices.listEdgeServiceServices,
        bindServiceEdgeNodeService: ServiceEdgeNodeV4.bindServiceEdgeNodeService,

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
