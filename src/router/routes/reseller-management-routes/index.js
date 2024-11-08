/** @type {import('vue-router').RouteRecordRaw} */
export const resellerManagementRoutes = {
  path: '/reseller/management',
  name: 'reseller-management',
  children: [
    {
      path: '',
      name: 'reseller-management',
      component: () => import('@views/ResellerManagement/ListView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Reseller Management',
            to: '/reseller/management'
          }
        ]
      }
    }
  ]
}
