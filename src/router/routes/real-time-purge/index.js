import * as Helpers from '@/helpers'
import * as RealTimePurgeService from '@/services/real-time-purge'

/** @type {import('vue-router').RouteRecordRaw} */
export const realTimePurgeRoutes = {
  path: '/real-time-purge',
  name: 'real-time-purge',
  children: [
    {
      path: '',
      name: 'list-real-time-purge',
      component: () => import('@views/RealTimePurge/ListView.vue'),
      props: {
        createRealTimePurgeService: RealTimePurgeService.createRealTimePurgeService,
        documentationService: Helpers.documentationCatalog.realTimePurge
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
    {
      path: 'create',
      name: 'create-real-time-purge',
      component: () => import('@views/RealTimePurge/CreateView.vue'),
      props: {
        createRealTimePurgeService: RealTimePurgeService.createRealTimePurgeService,
        contactSalesRealTimePurgeService: RealTimePurgeService.contactSalesRealTimePurgeService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Real-Time Purge',
            to: '/real-time-purge'
          },
          {
            label: 'Create Purge',
            to: '/real-time-purge/create'
          }
        ]
      }
    }
  ]
}
