import * as AccountSettingsServices from '@/services/account-settings-services'
import * as ResellerManagementServices from '@/services/accounts-management-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const resellerManagementRoutes = {
  path: '/reseller/management',
  name: 'reseller-management',
  children: [
    {
      path: '',
      name: 'reseller-management',
      component: () => import('@views/ResellersManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller/management'
          }
        ]
      },
      props: {}
    },
    {
      path: 'create',
      name: 'create-reseller',
      component: () => import('@views/ResellersManagement/CreateView.vue'),
      props: {
        listCountriesService: AccountSettingsServices.listCountriesService,
        listRegionsService: AccountSettingsServices.listRegionsService,
        listCitiesService: AccountSettingsServices.listCitiesService,
        createResellerAccountService: ResellerManagementServices.createResellerAccountService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller/management'
          },
          {
            label: 'Create Reseller Management',
            to: '/reseller/management/create'
          }
        ]
      }
    }
    // {
    //   path: 'edit/:id',
    //   name: 'edit-reseller',
    //   component: () => import('@views/ResellersManagement/CreateView.vue'),
    //   props: {
    //     listCountriesService: AccountSettingsServices.listCountriesService,
    //     listRegionsService: AccountSettingsServices.listRegionsService,
    //     listCitiesService: AccountSettingsServices.listCitiesService
    //   },
    //   meta: {
    //     breadCrumbs: [
    //       {
    //         label: 'Reseller Management',
    //         to: '/reseller/management'
    //       },
    //       {
    //         label: 'Create Reseller Management',
    //         to: '/reseller/management/create'
    //       },
    //       {
    //         label: 'Edit Reseller Management'
    //       }
    //     ]
    //   }
    // }
  ]
}
