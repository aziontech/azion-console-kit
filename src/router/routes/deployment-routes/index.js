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
      path: 'edit/:id/:tab(versions|releases)?',
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
      path: 'edit/:id/versions/:versionId',
      name: 'edit-deployment-version',
      component: () => import('@views/Deployments/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
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
          },
          {
            label: 'Version',
            dynamic: true,
            routeParam: 'versionId',
            useParamValue: true
          }
        ]
      }
    },
    {
      path: 'releases/new',
      name: 'release-composer',
      component: () => import('@views/Deployments/v6/ReleaseComposerView.vue'),
      meta: {
        title: 'Review & deploy',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Deployments',
            to: '/deployments'
          },
          {
            label: 'Deployment',
            dynamic: true,
            routeParam: 'id'
          },
          {
            label: 'New release'
          }
        ]
      }
    }
  ]
}
