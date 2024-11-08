/** @type {import('vue-router').RouteRecordRaw} */
export const clientManagementRoutes = {
  path: '/client/management',
  name: 'client-management',
  children: [
    {
      path: '',
      name: 'client-management',
      component: () => import('@views/ClientManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Client Management',
            to: '/client/management'
          }
        ]
      }
    }
  ]
}
