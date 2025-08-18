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
        listRealTimePurgeService: RealTimePurgeService.listRealTimePurgeService,
        documentationService: Helpers.documentationCatalog.realTimePurge
      },
      meta: {
        title: 'Real-Time Purge',
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
        contactSalesRealTimePurgeService: RealTimePurgeService.contactSalesRealTimePurgeService
      },
      meta: {
        title: 'Create Real-Time Purge',
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
