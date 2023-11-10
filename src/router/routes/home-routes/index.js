import * as UsersService from '@/services/users-services'
import InviteSession from '@/tests/helpers/invite-session'

/** @type {import('vue-router').RouteRecordRaw} */
export const homeRoutes = {
  path: '/',
  name: 'home',
  component: () => import('@views/Home/HomeView.vue'),
  props: {
    listTeamsService: UsersService.listTeamsService,
    inviteYourTeamService: UsersService.inviteYourTeamService,
    inviteSession: InviteSession
  }
}
