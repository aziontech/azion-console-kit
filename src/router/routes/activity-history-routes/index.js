/** @type {import('vue-router').RouteRecordRaw} */
export const activityHistoryRoutes = {
    path: '/activity-history',
    name: 'activity-history',
    children: [
      {
        path: '',
        name: 'list-activity-history',
        component: () => import('@views/ActivityHistory/ListView.vue'),
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
  