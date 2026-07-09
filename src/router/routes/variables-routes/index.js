import { hasFlagUseV6Configurations } from '@/composables/user-flag'

export const variablesTabGuard = (to) => {
  if (to.params.tab && !hasFlagUseV6Configurations()) {
    return '/not-found'
  }

  return true
}

/** @type {import('vue-router').RouteRecordRaw} */
export const variablesRoutes = {
  path: '/variables',
  name: 'variables',
  children: [
    {
      path: '',
      name: 'list-variables',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/Variables/v6/ListView.vue')
          : import('@views/Variables/ListView.vue'),
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
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/Variables/v6/CreateView.vue')
          : import('@views/Variables/CreateView.vue'),
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
      path: 'edit/:id/:tab?',
      name: 'edit-variables',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/Variables/v6/EditView.vue')
          : import('@views/Variables/EditView.vue'),
      beforeEnter: variablesTabGuard,
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
