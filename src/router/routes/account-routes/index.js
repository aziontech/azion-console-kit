import * as AccountService from '@/services/account-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const accountRoutes = {
  path: '/account',
  name: 'account',
  children: [
    {
      path: 'settings',
      name: 'account-settings',
      component: () => import('@views/Account/AccountSettingsView.vue'),
      props: {
        getAccountSettingsService: AccountService.getAccountSettings,
        updateAccountSettingsService: AccountService.updateAccountSettings,
        listCountriesService: AccountService.listCountriesService,
        listCitiesService: AccountService.listCitiesService,
        listRegionsService: AccountService.listRegionsService
      }
    }
  ]
}
