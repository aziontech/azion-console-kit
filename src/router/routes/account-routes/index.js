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
        deleteAccountService: AccountService.deleteAccount,
        getAccountSettingsService: AccountService.getAccountSettings,
        listCitiesService: AccountService.listCitiesService,
        listCountriesService: AccountService.listCountriesService,
        listRegionsService: AccountService.listRegionsService,
        updateAccountSettingsService: AccountService.updateAccountSettings
      }
    }
  ]
}
