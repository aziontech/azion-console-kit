import * as AccountSettingsServices from '@/services/account-settings-services'
import * as AccountManagementServices from '@/services/accounts-management-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const groupsManagementRoutes = {
  path: '/group/management',
  name: 'groups-management',
  children: [
    {
      path: '',
      name: 'list-groups-management',
      component: () => import('@views/GroupsManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Groups Management',
            to: '/groups-management'
          }
        ]
      },
      props: {}
    },
    {
      path: 'create',
      name: 'create-groups',
      component: () => import('@views/GroupsManagement/CreateView.vue'),
      props: {
        listCountriesService: AccountSettingsServices.listCountriesService,
        listRegionsService: AccountSettingsServices.listRegionsService,
        listCitiesService: AccountSettingsServices.listCitiesService,
        createAccountByTypeService: AccountManagementServices.createAccountByTypeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Groups Management',
            to: '/group/management'
          },
          {
            label: 'Create Group',
            to: '/group/management/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-groups',
      component: () => import('@views/GroupsManagement/EditView.vue'),
      props: {
        listCountriesService: AccountSettingsServices.listCountriesService,
        listRegionsService: AccountSettingsServices.listRegionsService,
        listCitiesService: AccountSettingsServices.listCitiesService,
        createAccountByTypeService: AccountManagementServices.createAccountByTypeService,
        loadAccountService: AccountManagementServices.loadAccountService,
        editAccountService: AccountManagementServices.editAccountService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Groups Management',
            to: '/group/management'
          },
          {
            label: 'Edit Group'
          }
        ]
      }
    }
  ]
}
