import * as NetworkListsService from '@/services/network-lists-services'
import { documentationSecureProducts } from '@/helpers/azion-documentation-catalog'

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
      name: 'edit-network-list',
      component: () => import('@views/NetworkLists/EditView.vue'),
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
    }
  ]
}
