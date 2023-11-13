import * as ActivityHistoryService from '@/services/activity-history-services'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const activityHistoryRoutes = {
  path: '/activity-history',
  name: 'activity-history',
  children: [
    {
      path: '',
      name: 'list-activity-history',
      component: () => import('@views/ActivityHistory/ListView.vue'),
      props: {
        listEventsService: ActivityHistoryService.listEventsService,
        documentationService: Helpers.documentationCatalog.getStarted
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Activity History',
            to: '/activity-history'
          }
        ]
      }
    }
  ]
}
