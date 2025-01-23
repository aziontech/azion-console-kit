import * as NetworkListsService from '@/services/network-lists-services'
import * as NetworkListsServiceV4 from '@/services/network-lists-services/v4'

import * as Helpers from '@/helpers'

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
        listNetworkListService: NetworkListsServiceV4.listNetworkListService,
        deleteNetworkListService: NetworkListsServiceV4.deleteNetworkListService,
        documentationService: Helpers.documentationCatalog.networkLists
      },
      meta: {
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
        createNetworkListService: NetworkListsService.createNetworkListService,
        listCountriesService: NetworkListsService.listCountriesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Create Network List',
            to: '/network-lists/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-network-list',
      component: () => import('@views/NetworkLists/EditView.vue'),
      props: {
        editNetworkListsService: NetworkListsServiceV4.editNetworkListService,
        loadNetworkListsService: NetworkListsServiceV4.loadNetworkListService,
        listCountriesService: NetworkListsService.listCountriesService,
        updatedRedirect: 'list-network-list'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Edit Network List'
          }
        ]
      }
    }
  ]
}
