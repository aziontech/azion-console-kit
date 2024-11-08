/** @type {import('vue-router').RouteRecordRaw} */
export const groupsManagementRoutes = {
  path: '/groups/management',
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
      props: {},
      meta: {
        breadCrumbs: [
          {
            label: 'Groups Management',
            to: '/groups/management'
          },
          {
            label: 'Create Groups Management',
            to: '/groups/management/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-groups',
      component: () => import('@views/GroupsManagement/EditView.vue'),
      props: {},
      meta: {
        breadCrumbs: [
          {
            label: 'Groups Management',
            to: '/groups/management'
          },
          {
            label: 'Create Groups Management',
            to: '/groups/management/create'
          },
          {
            label: 'Edit Groups Management'
          }
        ]
      }
    }
  ]
}
