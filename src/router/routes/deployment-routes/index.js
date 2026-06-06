// src/router/routes/deployment-routes/index.js

/** @type {import('vue-router').RouteRecordRaw} */
export const deploymentRoutes = {
  path: '/deployments',
  name: 'deployments',
  meta: {
    flag: 'use_v6_configurations'
  },
  children: [
    {
      path: '',
      redirect: { name: 'deployments-list', params: { tab: 'overview' } }
    },
    {
      path: 'create',
      name: 'deployments-create',
      component: () => import('@views/Deployments/CreateView.vue'),
      meta: {
        title: 'Create Deployment',
        breadCrumbs: [
          {
            label: 'Deployments',
            to: '/deployments'
          },
          {
            label: 'Create'
          }
        ]
      }
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
