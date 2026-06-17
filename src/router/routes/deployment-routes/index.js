// src/router/routes/deployment-routes/index.js

/** @type {import('vue-router').RouteRecordRaw} */
export const deploymentRoutes = {
  path: '/deployments',
  name: 'deployments',
  children: [
    {
      path: '',
      redirect: { name: 'deployments-list', params: { tab: 'overview' } }
    },
    {
      path: ':tab(overview|history)',
      name: 'deployments-list',
      component: () => import('@views/Deployments/TabsView.vue'),
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
