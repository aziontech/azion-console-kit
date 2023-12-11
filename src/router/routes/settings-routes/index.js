import * as UsersService from '@/services/users-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const settingsRoutes = {
  path: '/settings',
  name: 'settings',
  children: [
    {
      path: '',
      name: 'settings',
      component: () => import('@views/Settings/EditView.vue'),
      props: {
        loadAccountDetailsService: UsersService.loadAccountDetailsService,
        listCountriesPhoneService: UsersService.listCountriesPhoneService,
        listTimezonesService: UsersService.listTimezonesService,
        createUsersService: UsersService.createUsersService,
        listTeamsService: UsersService.listTeamsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Your Settings',
            to: '/settings'
          },
        ]
      }
    }
  ]
}
