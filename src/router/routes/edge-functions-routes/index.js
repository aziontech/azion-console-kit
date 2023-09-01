import * as EdgeFunctionsService from '@/services/edge-functions-services'

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
        deleteEdgeFunctionsService: EdgeFunctionsService.deleteEdgeFunctionsService,
        listEdgeFunctionsService: EdgeFunctionsService.listEdgeFunctionsService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Edge Functions',
            to: '/edge-functions'
          }
        ]
      }
    }
  ]
}
