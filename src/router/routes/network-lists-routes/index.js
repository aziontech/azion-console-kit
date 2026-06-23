import * as NetworkListsService from '@/services/network-lists-services'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

/** @type {import('vue-router').RouteRecordRaw} */
export const networkListsRoutes = {
  path: '/network-lists',
  name: 'network-lists',
  children: [
    {
      path: '',
      name: 'list-network-list',
      component: () => import('@views/NetworkLists/ListView.vue'),
      props: {
        documentationService: documentationSecureProducts.networkLists
      },
      meta: {
        title: 'Network Lists',
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-network-list',
      component: () => import('@views/NetworkLists/CreateView.vue'),
      props: {
        listCountriesService: NetworkListsService.listCountriesService
      },
      meta: {
        title: 'Create Network List',
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Create',
            to: '/network-lists/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-network-lists',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/NetworkLists/v6/EditView.vue')
          : import('@views/NetworkLists/EditView.vue'),
      props: {
        listCountriesService: NetworkListsService.listCountriesService,
        updatedRedirect: 'list-network-list'
      },
      meta: {
        title: 'Edit Network List',
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Edit Network List',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId',
      name: 'edit-network-lists-version',
      component: () => import('@views/NetworkLists/v6/VersionEditView.vue'),
      props: {
        listCountriesService: NetworkListsService.listCountriesService
      },
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Edit Network List',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-network-lists', params: ['id'] }
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
