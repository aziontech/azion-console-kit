import * as AccountSettingsServices from '@/services/account-settings-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const resellerManagementRoutes = {
  path: '/reseller',
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
            to: '/reseller-management'
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
        listCitiesService: AccountSettingsServices.listCitiesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller'
          },
          {
            label: 'Create Reseller Management',
            to: '/reseller/create'
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
        listCitiesService: AccountSettingsServices.listCitiesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller'
          },
          {
            label: 'Create Reseller Management',
            to: '/reseller/create'
          },
          {
            label: 'Edit Reseller Management'
          }
        ]
      }
    }
  ]
}
