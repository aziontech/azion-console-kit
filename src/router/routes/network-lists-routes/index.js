import * as NetworkListsService from '@/services/network-lists-services'

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
        listNetworkListService: NetworkListsService.listNetworkListService,
        deleteNetworkListService: NetworkListsService.deleteNetworkListService
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
            label: 'Create Network',
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
        editNetworkListsService: NetworkListsService.editNetworkListService,
        loadNetworkListsService: NetworkListsService.loadNetworkListService,
        listCountriesService: NetworkListsService.listCountriesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Network Lists',
            to: '/network-lists'
          },
          {
            label: 'Edit Network'
          }
        ]
      }
    }
  ]
}
