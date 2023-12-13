import * as UsersService from '@/services/users-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const settingsRoutes = {
  path: '/settings',
  name: 'settings',
  children: [
    {
      path: '',
      name: 'settings',
      component: () => import('@views/YourSettings/EditView.vue'),
      props: {
        listCountriesPhoneService: UsersService.listCountriesPhoneService,
        listTimezonesService: UsersService.listTimezonesService,
        loadUserService: UsersService.loadUserService,
        editUsersService: UsersService.editUsersService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Your Settings',
            to: '/settings'
          }
        ]
      }
    }
  ]
}
