/** @type {import('vue-router').RouteRecordRaw} */
import { clipboardWrite } from '@/helpers/clipboard'

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
        breadCrumbs: [
          {
            label: `Workloads`,
            to: `/workloads`
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-workload',
      component: () => import('@views/Workload/CreateView.vue'),
      props: {
        clipboardWrite
      },
      meta: {
        title: 'Create Workload',
        flag: 'checkout_access_without_flag',
        breadCrumbs: [
          {
            label: `Workloads`,
            to: `/workloads`
          },
          {
            label: `Create`,
            to: `/workloads/create`
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: `edit-workload`,
      component: () => import('@views/Workload/EditView.vue'),
      props: {
        updatedRedirect: `list-workloads`
      },
      meta: {
        title: 'Edit Workload',
        flag: 'checkout_access_without_flag',
        breadCrumbs: [
          {
            label: `Workloads`,
            to: `/workloads`
          },
          {
            label: `Edit Workload`,
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
