import * as AccountSettingsServices from '@/services/account-settings-services'
import * as AccountManagementServices from '@/services/accounts-management-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const resellerManagementRoutes = {
  path: '/reseller/management',
  name: 'reseller-management',
  children: [
    {
      path: '',
      name: 'list-reseller-management',
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
        createAccountByTypeService: AccountManagementServices.createAccountByTypeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller/management'
          },
          {
            label: 'Create Reseller',
            to: '/reseller/management/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-reseller',
      component: () => import('@views/ResellersManagement/EditView.vue'),
      props: {
        listCountriesService: AccountSettingsServices.listCountriesService,
        listRegionsService: AccountSettingsServices.listRegionsService,
        listCitiesService: AccountSettingsServices.listCitiesService,
        loadAccountService: AccountManagementServices.loadAccountService,
        editAccountService: AccountManagementServices.editAccountService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller/management'
          },
          {
            label: 'Edit Reseller'
          }
        ]
      }
    }
  ]
}
