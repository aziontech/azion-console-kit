import * as AccountSettingsServices from '@/services/account-settings-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const accountRoutes = {
  path: '/account',
  name: 'account',
  children: [
    {
      path: 'settings',
      name: 'account-settings',
      component: () => import('@views/AccountSettings/AccountSettingsView.vue'),
      props: {
        accountSettingsService: AccountSettingsServices.accountSettingsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Account Settings',
            to: '/account/settings'
          }
        ],
      }
    }
  ]
}
