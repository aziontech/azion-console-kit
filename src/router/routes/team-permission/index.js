/** @type {import('vue-router').RouteRecordRaw} */
export const teamsPermissionRoutes = {
  path: '/teams-permission',
  children: [
    {
      path: '',
      name: 'teams-permission',
      component: () => import('@views/TeamsPermissions/ListView.vue'),
      meta: {
        title: 'Teams Permissions',
        breadCrumbs: [
          {
            label: 'Teams Permissions',
            to: '/teams-permission'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-teams-permission',
      component: () => import('@views/TeamsPermissions/CreateView.vue'),
      meta: {
        title: 'Create Team Permission',
        breadCrumbs: [
          {
            label: 'Teams Permissions',
            to: '/teams-permission'
          },
          {
            label: 'Create',
            to: '/teams-permission/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-teams-permission',
      component: () => import('@views/TeamsPermissions/EditView.vue'),
      meta: {
        title: 'Edit Team Permission',
        breadCrumbs: [
          {
            label: 'Teams Permissions',
            to: '/teams-permission'
          },
          {
            label: 'Edit Team',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
