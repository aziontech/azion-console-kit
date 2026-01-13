import * as UsersService from '@/services/users-services'
import { documentationAccountsProducts } from '@/helpers/azion-documentation-catalog'


/** @type {import('vue-router').RouteRecordRaw} */
export const usersListsRoutes = {
  path: '/users',
  name: 'users-lists',
  children: [
    {
      path: '',
      name: 'list-users',
      component: () => import('@views/Users/ListView.vue'),
      props: {
        listUsersService: UsersService.listUsersService,
        deleteUsersService: UsersService.deleteUsersService,
        documentationService: documentationAccountsProducts.usersManagement
      },
      meta: {
        title: 'Users',
        breadCrumbs: [
          {
            label: 'Users Management',
            to: '/users'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-users',
      component: () => import('@views/Users/CreateView.vue'),
      props: {
        loadAccountDetailsService: UsersService.loadAccountDetailsService,
        listCountriesPhoneService: UsersService.listCountriesPhoneService,
        listTimezonesService: UsersService.listTimezonesService,
        createUsersService: UsersService.createUsersService,
        listTeamsService: UsersService.listTeamsService
      },
      meta: {
        title: 'Create User',
        breadCrumbs: [
          {
            label: 'Users Management',
            to: '/users'
          },
          {
            label: 'Create',
            to: '/users/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-users',
      component: () => import('@views/Users/EditView.vue'),
      props: {
        loadAccountDetailsService: UsersService.loadAccountDetailsService,
        listCountriesPhoneService: UsersService.listCountriesPhoneService,
        listTimezonesService: UsersService.listTimezonesService,
        listTeamsService: UsersService.listTeamsService,
        editAnotherUserService: UsersService.editAnotherUserService,
        loadAnotherUserService: UsersService.loadAnotherUserService,
        updatedRedirect: 'list-users'
      },
      meta: {
        title: 'Edit User',
        breadCrumbs: [
          {
            label: 'Users Management',
            to: '/users'
          },
          {
            label: 'Edit',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
