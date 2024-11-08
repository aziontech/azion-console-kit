import * as AccountSettingsServices from '@/services/account-settings-services'
import * as AccountManagementServices from '@/services/accounts-management-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const clientManagementRoutes = {
  path: '/client/management',
  name: 'client-management',
  children: [
    {
      path: '',
      name: 'list-client-management',
      component: () => import('@views/ClientsManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Client Management',
            to: '/client/management'
          }
        ]
      },
      props: {}
    },
    {
      path: 'create',
      name: 'create-client',
      component: () => import('@views/ClientsManagement/CreateView.vue'),
      props: {
        listCountriesService: AccountSettingsServices.listCountriesService,
        listRegionsService: AccountSettingsServices.listRegionsService,
        listCitiesService: AccountSettingsServices.listCitiesService,
        createAccountByTypeService: AccountManagementServices.createAccountByTypeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Client Management',
            to: '/client/management'
          },
          {
            label: 'Create Client Management',
            to: '/client/management/create'
          }
        ]
      }
    }
    // {
    //   path: 'edit/:id',
    //   name: 'edit-client',
    //   component: () => import('@views/ClientsManagement/EditView.vue'),
    //   props: {},
    //   meta: {
    //     breadCrumbs: [
    //       {
    //         label: 'Client Management',
    //         to: '/client/management'
    //       },
    //       {
    //         label: 'Create Client Management',
    //         to: '/client/management/create'
    //       },
    //       {
    //         label: 'Edit Client Management'
    //       }
    //     ]
    //   }
    // }
  ]
}
