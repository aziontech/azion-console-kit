import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { switchAccountService } from '@/services/auth-services/switch-account-service'
import { AccountHandler } from '@/helpers/account-handler'

/** @type {import('vue-router').RouteRecordRaw} */
export const loginRoutes = {
  path: '/login',
  name: 'login',
  component: () => import('@views/Login/LoginView.vue'),
  props: {
    authenticationLoginService: AuthServices.loginService,
    verifyLoginService: AuthServices.verifyAuthenticationService,
    refreshLoginService: AuthServices.refreshAuthenticationService,
    sendResetPasswordEmailService: AuthServices.sendResetPasswordEmailService,
    accountHandler: new AccountHandler(switchAccountService, listTypeAccountService)
  },
  meta: {}
}
