// import * as Helpers from '@/helpers'
import * as TeamPermissionService from '@/services/team-permission'
/** @type {import('vue-router').RouteRecordRaw} */
export const teamsPermissionRoutes = {
  path: '/teams-permession',
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
    }
  ]
}
