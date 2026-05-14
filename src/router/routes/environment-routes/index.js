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
    },
    {
      path: 'create',
      name: 'create-environment',
      component: () => import('@views/Environments/CreateView.vue'),
      meta: {
        title: 'Create Environment',
        breadCrumbs: [
          {
            label: 'Environments',
            to: '/environments'
          },
          {
            label: 'Create',
            to: '/environments/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-environment',
      component: () => import('@views/Environments/EditView.vue'),
      props: {
        updatedRedirect: 'environment-list'
      },
      meta: {
        title: 'Edit Environment',
        breadCrumbs: [
          {
            label: 'Environments',
            to: '/environments'
          },
          {
            label: 'Edit Environment',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
