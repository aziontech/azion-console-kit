/** @type {import('vue-router').RouteRecordRaw} */
export const groupManagementRoutes = {
  path: '/group/management',
  name: 'group-management',
  children: [
    {
      path: '',
      name: 'group-management',
      component: () => import('@views/GroupManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Group Management',
            to: '/group/management'
          }
        ]
      }
    }
  ]
}
