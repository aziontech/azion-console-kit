// src/router/routes/deployment-routes/index.js

/** @type {import('vue-router').RouteRecordRaw} */
export const deploymentRoutes = {
  path: '/deployments',
  name: 'deployments',
  children: [
    {
      path: '',
      name: 'deployments-list',
      component: () => import('@views/Deployments/ListView.vue'),
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
