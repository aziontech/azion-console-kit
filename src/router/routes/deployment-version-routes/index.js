// src/router/routes/deployment-version-routes/index.js

/** @type {import('vue-router').RouteRecordRaw} */
export const deploymentVersionRoutes = {
  path: '/deployment-versions',
  name: 'deployment-versions',
  children: [
    {
      path: '',
      name: 'deployment-versions-list',
      component: () => import('@views/DeploymentVersions/ListView.vue'),
      meta: {
        title: 'Deployment Versions',
        breadCrumbs: [
          {
            label: 'Deployments Versions',
            to: '/deployment-versions'
          }
        ]
      }
    }
  ]
}
