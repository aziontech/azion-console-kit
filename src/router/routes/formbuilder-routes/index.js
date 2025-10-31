import * as UsersService from '@/services/users-services'
import {
  InviteSession,
  documentationGuideProducts,
  openDocumentation,
  openAPIDocumentation,
  openContactSupport
} from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const formbuilderRoutes = {
  path: '/formbuilder',
  name: 'formbuilder',
  component: () => import('@views/FormBuilder/FormBuilderView.vue'),
  props: {
    listTeamsService: UsersService.listTeamsService,
    inviteYourTeamService: UsersService.inviteYourTeamService,
    inviteSession: InviteSession,
    windowManager: {
      documentationGuideProducts,
      openDocumentation,
      openAPIDocumentation,
      openContactSupport
    }
  }
}
