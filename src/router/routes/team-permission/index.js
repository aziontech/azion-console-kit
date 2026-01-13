import * as Helpers from '@/helpers'
import * as TeamPermissionService from '@/services/team-permission'
/** @type {import('vue-router').RouteRecordRaw} */
export const teamsPermissionRoutes = {
  path: '/teams-permission',
  children: [
    {
      path: '',
      name: 'teams-permission',
      component: () => import('@views/TeamsPermissions/ListView.vue'),
      props: {
        listTeamPermissionService: TeamPermissionService.listTeamPermissionService,
        deleteTeamPermissionService: TeamPermissionService.deleteTeamPermissionService,
        documentationService: Helpers.documentationCatalog.teamPermissions
      },
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
      props: {
        createTeamPermissionsService: TeamPermissionService.createTeamPermissionsService,
        listPermissionService: TeamPermissionService.listPermissionService
      },
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
      props: {
        editTeamPermissionService: TeamPermissionService.editTeamPermissionService,
        loadTeamPermissionService: TeamPermissionService.loadTeamPermissionService,
        listPermissionService: TeamPermissionService.listPermissionService,
        updatedRedirect: 'teams-permission'
      },
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
