import { hasFlagUseV6Configurations } from '@/composables/user-flag'

/** @type {import('vue-router').RouteRecordRaw} */
export const workloadRoutes = {
  path: `/workloads`,
  name: `/workloads`,
  children: [
    {
      path: '',
      name: `list-workloads`,
      component: () => import('@views/Workload/ListView.vue'),
      meta: {
        title: 'Workloads',
        flag: 'checkout_access_without_flag',
        breadCrumbs: [{ label: `Workloads`, to: `/workloads` }]
      }
    },
    {
      path: 'create',
      name: 'create-workload',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/Workload/CreateView.vue')
          : import('@views/Workload/legacy/CreateView.vue'),
      meta: {
        title: 'Create Workload',
        flag: 'checkout_access_without_flag',
        breadCrumbs: [
          { label: `Workloads`, to: `/workloads` },
          { label: `Create`, to: `/workloads/create` }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: `edit-workload`,
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/Workload/TabsView.vue')
          : import('@views/Workload/legacy/EditView.vue'),
      props: {
        updatedRedirect: `list-workloads`
      },
      meta: {
        title: 'Edit Workload',
        flag: 'checkout_access_without_flag',
        breadCrumbs: [
          { label: `Workloads`, to: `/workloads` },
          { label: `Edit Workload`, dynamic: true, routeParam: 'id' }
        ]
      }
    },
    {
      path: 'edit/:id/versions/:versionId',
      name: 'edit-workload-version',
      component: () => import('@views/Workload/v6/VersionEditView.vue'),
      meta: {
        title: 'Edit Version',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          { label: `Workloads`, to: `/workloads` },
          {
            label: `Edit Workload`,
            dynamic: true,
            routeParam: 'id',
            toRoute: { name: 'edit-workload', params: ['id'] }
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
      path: 'edit/:id/deployment/:versionId',
      name: 'workload-deployment-details',
      component: () => import('@views/Workload/DeploymentDetailsView.vue'),
      meta: {
        title: 'Deployment Details',
        flag: 'use_v6_configurations'
      }
    }
  ]
}
