import * as UsersService from '@/services/users-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const settingsRoutes = {
  path: '/settings',
  children: [
    {
      path: '',
      name: 'your-settings',
      component: () => import('@views/YourSettings/EditView.vue'),
      props: {
        listCountriesPhoneService: UsersService.listCountriesPhoneService,
        listTimezonesService: UsersService.listTimezonesService,
        loadUserService: UsersService.loadUserService,
        editUsersService: UsersService.editUsersService
      },
      meta: {
        title: 'Your Settings',
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
