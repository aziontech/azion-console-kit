import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeConnectorsRoutes = {
  path: '/connectors',
  name: 'connectors',
  children: [
    {
      path: '',
      name: 'list-connectors',
      component: () => import('@views/EdgeConnectors/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.edgeConnectors,
        clipboardWrite: Helpers.clipboardWrite
      },
      meta: {
        title: 'Connectors',
        breadCrumbs: [
          {
            label: 'Connectors',
            to: '/connectors'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'create',
      name: 'create-connectors',
      component: () => import('@views/EdgeConnectors/CreateView.vue'),
      meta: {
        title: 'Create Connector',
        breadCrumbs: [
          {
            label: 'Connectors',
            to: '/connectors'
          },
          {
            label: 'Create',
            to: '/connectors/create'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-connectors',
      component: () => import('@views/EdgeConnectors/EditView.vue'),
      meta: {
        title: 'Edit Connector',
        breadCrumbs: [
          {
            label: 'Connectors',
            to: '/connectors'
          },
          {
            label: 'Edit Connector',
            dynamic: true,
            routeParam: 'id'
          }
        ],
        flag: 'checkout_access_without_flag'
      }
    }
  ]
}
