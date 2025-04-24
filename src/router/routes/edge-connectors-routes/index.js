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
        flag: 'checkout_access'
      }
    }
  ]
}
