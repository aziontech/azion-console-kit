// import * as Helpers from '@/helpers'
import * as RealTimePurgeService from '@/services/real-time-purge'
/** @type {import('vue-router').RouteRecordRaw} */
export const realTimePurgeRoutes = {
  path: '/real-time-purge',
  name: 'real-time-purge',
  children: [
    {
      path: '',
      name: 'real-time-purge',
      component: () => import('@views/RealTimePurge/ListView.vue'),
      props: {
        listRealTimePurgeService: RealTimePurgeService.listRealTimePurgeService,
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Real-Time Purge',
            to: '/real-time-purge'
          }
        ]
      }
    },
  ]
}
