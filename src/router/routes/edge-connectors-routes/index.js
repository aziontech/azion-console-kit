import * as Helpers from '@/helpers'
import * as EdgeConnectorsService from '@/services/edge-connectors'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeConnectorsRoutes = {
  path: '/edge-connectors',
  name: 'edge-connectors',
  children: [
    {
      path: '',
      name: 'list-edge-connectors',
      component: () => import('@views/EdgeConnectors/ListView.vue'),
      props: {
        listEdgeConnectorsService: EdgeConnectorsService.listEdgeConnectorsService,
        deleteEdgeConnectorsService: EdgeConnectorsService.deleteEdgeConnectorsService,
        documentationService: Helpers.documentationCatalog.edgeConnectors,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Connectors',
            to: '/edge-connectors'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'create',
      name: 'create-edge-connectors',
      component: () => import('@views/EdgeConnectors/CreateView.vue'),
      props: {
        createEdgeConnectorsService: EdgeConnectorsService.createEdgeConnectorsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Connectors',
            to: '/edge-connectors'
          },
          {
            label: 'Create Edge Connectors',
            to: '/edge-connectors/create'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-edge-connectors',
      component: () => import('@views/EdgeConnectors/EditView.vue'),
      props: {
        editEdgeConnectorsService: EdgeConnectorsService.editEdgeConnectorsService,
        loadEdgeConnectorsService: EdgeConnectorsService.loadEdgeConnectorsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Connectors',
            to: '/edge-connectors'
          },
          {
            label: 'Edit Edge Connectors'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    }
  ]
}
