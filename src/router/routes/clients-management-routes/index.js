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
      props: {},
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
    },
    {
      path: 'edit/:id',
      name: 'edit-client',
      component: () => import('@views/ClientManagement/EditView.vue'),
      props: {},
      meta: {
        breadCrumbs: [
          {
            label: 'Client Management',
            to: '/client/management'
          },
          {
            label: 'Create Client Management',
            to: '/client/management/create'
          },
          {
            label: 'Edit Client Management'
          }
        ]
      }
    }
  ]
}
