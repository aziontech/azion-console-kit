import { listEnvironmentsService } from '@/services/v2/environment/environment-mock'

/** @type {import('vue-router').RouteRecordRaw} */
export const environmentRoutes = {
  path: '/environments',
  name: 'environment',
  children: [
    {
      path: '',
      name: 'environment-list',
      component: () => import('@views/Environments/ListView.vue'),
      props: {
        listEnvironmentsService
      },
      meta: {
        title: 'Environments',
        breadCrumbs: [
          {
            label: 'Environments',
            to: '/environments'
          }
        ]
      }
    }
  ]
}
