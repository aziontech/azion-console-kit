/** @type {import('vue-router').RouteRecordRaw} */
export const edgeSQLRoutes = {
  path: '/edge-sql',
  name: 'edge-sql',
  children: [
    {
      path: '',
      name: 'list-edge-sql-databases',
      component: () => import('@views/EdgeSQL/ListView.vue'),
      props: {
        documentationService: () => 'https://www.azion.com/en/documentation/products/edge-sql/'
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge SQL',
            to: '/edge-sql'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-sql-database',
      component: () => import('@views/EdgeSQL/CreateView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'Edge SQL',
            to: '/edge-sql'
          },
          {
            label: 'Create Database'
          }
        ]
      }
    },
    {
      path: 'database/:id/:tab?',
      name: 'edge-sql-database',
      component: () => import('@views/EdgeSQL/DatabaseView.vue'),
      props: true,
      meta: {
        breadCrumbs: [
          {
            label: 'Edge SQL',
            to: '/edge-sql'
          },
          {
            label: 'Database'
          }
        ]
      }
    }
  ]
}
