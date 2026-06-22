import { hasFlagUseV6Configurations } from '@/composables/user-flag'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'

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
        documentationService: documentationSecureProducts.connectors
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
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/EdgeConnectors/v6/EditView.vue')
          : import('@views/EdgeConnectors/EditView.vue'),
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
    },
    {
      path: 'edit/:id/versions/:versionId',
      name: 'edit-connectors-version',
      component: () => import('@views/EdgeConnectors/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Connectors',
            to: '/connectors'
          },
          {
            label: 'Edit Connector',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-connectors', params: ['id'] }
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    }
  ]
}
