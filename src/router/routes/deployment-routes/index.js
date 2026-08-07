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
      path: 'edit/:id/:tab(settings|releases|version-history)?',
      name: 'deployments-edit',
      component: () => import('@views/Deployments/TabsView.vue'),
      meta: {
        title: 'Edit Deployment',
        breadCrumbs: [
          {
            label: 'Deployments',
            to: '/deployments'
          },
          {
            label: 'Edit Deployment',
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'deployments-edit', params: ['id'] }
          }
        ]
      }
    },
    {
      path: 'releases/new',
      name: 'release-composer',
      component: () => import('@views/Deployments/v6/ReleaseComposerView.vue'),
      meta: {
        title: 'Review and deploy',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Deployments',
            to: '/deployments'
          },
          {
            label: 'Releases',
            dynamic: true,
            routeParam: 'id'
          },
          {
            label: 'Review and deploy'
          }
        ]
      }
    }
  ]
}
