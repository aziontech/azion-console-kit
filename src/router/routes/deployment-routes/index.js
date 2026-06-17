// src/router/routes/deployment-routes/index.js

import { listDeploymentsService } from '@/services/v2/deployment/deployment-mock'

/** @type {import('vue-router').RouteRecordRaw} */
export const deploymentRoutes = {
  path: '/deployments',
  name: 'deployments',
  children: [
    {
      path: '',
      name: 'deployments-list',
      component: () => import('@views/Deployments/ListView.vue'),
      props: {
        listDeploymentsService
      },
      meta: {
        title: 'Deployments',
        breadCrumbs: [
          {
            label: 'Deployments',
            to: '/deployments'
          }
        ]
      }
    }
  ]
}
