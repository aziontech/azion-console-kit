import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeFunctionsRoutes = {
  path: '/edge-functions',
  name: 'edge-functions',
  children: [
    {
      path: '',
      name: 'list-edge-functions',
      component: () => import('@views/EdgeFunctions/ListView.vue'),
      props: {
        documentationService: Helpers.documentationCatalog.edgeFunctions
      },
      meta: {
        title: 'Functions',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/edge-functions'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-edge-functions',
      component: () => import('@views/EdgeFunctions/CreateView.vue'),
      meta: {
        title: 'Create Function',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/edge-functions'
          },
          {
            label: 'Create Function',
            to: '/edge-functions/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-edge-functions',
      component: () => import('@views/EdgeFunctions/EditView.vue'),
      props: {
        updatedRedirect: 'list-edge-functions'
      },
      meta: {
        title: 'Edit Function',
        breadCrumbs: [
          {
            label: 'Functions',
            to: '/edge-functions'
          },
          {
            label: 'Edit Function'
          }
        ]
      }
    }
  ]
}
