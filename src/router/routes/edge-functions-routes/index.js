import * as Helpers from '@/helpers'

import * as EdgeFunctionsService from '@/services/edge-functions-services'
import * as EdgeFunctionsServiceV4 from '@/services/edge-functions-services/v4'

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
        deleteEdgeFunctionsService: EdgeFunctionsServiceV4.deleteEdgeFunctionService,
        listEdgeFunctionsService: EdgeFunctionsServiceV4.listEdgeFunctionsService,
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
      props: {
        createEdgeFunctionsService: EdgeFunctionsService.createEdgeFunctionsService
      },
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
        loadEdgeFunctionsService: EdgeFunctionsService.loadEdgeFunctionsService,
        editEdgeFunctionsService: EdgeFunctionsService.editEdgeFunctionsService,
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
