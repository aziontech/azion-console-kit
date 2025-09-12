/** @type {import('vue-router').RouteRecordRaw} */
import * as Helpers from '@/helpers'

export const edgeSQLRoutes = {
  path: '/sql-database',
  name: 'sql-database',
  children: [
    {
      path: '',
      name: 'list-sql-databases',
      component: () => import('@views/EdgeSQL/ListView.vue'),
      props: {
        documentationService: Helpers.documentationGuideProducts.edgeSQL
      },
      meta: {
        breadCrumbs: [
          {
            label: 'SQL Database',
            to: '/sql-database'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-sql-database',
      component: () => import('@views/EdgeSQL/CreateView.vue'),
      meta: {
        breadCrumbs: [
          {
            label: 'SQL Database',
            to: '/sql-database'
          },
          {
            label: 'Create Database'
          }
        ]
      }
    },
    {
      path: 'database/:id/:tab?',
      name: 'sql-database',
      component: () => import('@views/EdgeSQL/DatabaseView.vue'),
      props: true,
      meta: {
        breadCrumbs: [
          {
            label: 'SQL Database',
            to: '/sql-database'
          },
          {
            label: 'Edit Database'
          }
        ]
      }
    }
  ]
}
