/** @type {import('vue-router').RouteRecordRaw} */
export const variablesRoutes = {
  path: '/variables',
  name: 'variables',
  children: [
    {
      path: '',
      name: 'list-variables',
      component: () => import('@views/Variables/ListView.vue'),
      meta: {
        title: 'Variables',
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-variables',
      component: () => import('@views/Variables/CreateView.vue'),
      meta: {
        title: 'Create Variable',
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          },
          {
            label: 'Create',
            to: '/variables/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-variables',
      component: () => import('@views/Variables/EditView.vue'),
      meta: {
        title: 'Edit Variable',
        breadCrumbs: [
          {
            label: 'Variables',
            to: '/variables'
          },
          {
            label: 'Edit Variable',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
