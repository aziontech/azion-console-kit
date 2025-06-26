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
        breadCrumbs: [
          {
            label: 'Edge Functions',
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
        breadCrumbs: [
          {
            label: 'Edge Functions',
            to: '/edge-functions'
          },
          {
            label: 'Create Edge Function',
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
        breadCrumbs: [
          {
            label: 'Edge Functions',
            to: '/edge-functions'
          },
          {
            label: 'Edit Edge Function'
          }
        ]
      }
    }
  ]
}
