import * as Helpers from '@/helpers'
import * as UsersService from '@/services/users-services'

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
        documentationService: Helpers.documentationCatalog.users
      },
      meta: {
        title: 'Users',
        breadCrumbs: [
          {
            label: 'Users',
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
            label: 'Users',
            to: '/users'
          },
          {
            label: 'Create User',
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
            label: 'Users',
            to: '/users'
          },
          {
            label: 'Edit User',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
