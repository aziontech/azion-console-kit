import * as EdgeApplicationsService from '@/services/edge-application-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const edgeApplicationRoutes = {
  path: '/edge-applications',
  name: 'edge-applications',
  component: () => import('@views/EdgeApplications/ListView.vue'),
  props: {
    listEdgeApplicationsService: EdgeApplicationsService.listEdgeApplicationsService,
    deleteEdgeApplicationService: EdgeApplicationsService.deleteEdgeApplicationService
  },
  meta: {
    breadCrumbs: [
      {
        label: 'Edge Applications',
        to: '/edge-applications'
      }
    ]
  }
}
