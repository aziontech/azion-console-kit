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
        deleteUsersService: UsersService.deleteUsersService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Users Lists',
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
        createUsersService: UsersService.createUsersService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Users Lists',
            to: '/users'
          },
          {
            label: 'Create Users',
            to: '/users/create'
          }
        ]
      }
    }
  ]
}
