// import * as Helpers from '@/helpers'
import * as TeamPermissionService from '@/services/team-permission'
/** @type {import('vue-router').RouteRecordRaw} */
export const teamsPermissionRoutes = {
  path: '/teams-permission',
  name: 'teams-permession',
  children: [
    {
      path: '',
      name: 'teams-permission',
      component: () => import('@views/TeamsPermissions/ListView.vue'),
      props: {
        listTeamPermissionService: TeamPermissionService.listTeamPermissionService,
        deleteTeamPermissionService: TeamPermissionService.deleteTeamPermissionService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Teams Permessions',
            to: '/teams-permission'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-teams-permission',
      component: () => import('@views/TeamsPermissions/CreateView.vue'),
      props: {
        createTeamPermissionsService: TeamPermissionService.createTeamPermissionsService,
        listPermissionService: TeamPermissionService.listPermissionService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Teams Permessions',
            to: '/teams-permission'
          },
          {
            label: 'Create Teams Permissions',
            to: '/teams-permission/create'
          }
        ]
      }
    }
  ]
}
