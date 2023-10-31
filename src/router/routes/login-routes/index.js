import * as AuthServices from '@/services/auth-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const loginRoutes = {
  path: '/login',
  name: 'login',
  component: () => import('@views/Login/LoginView.vue'),
  props: {
    authenticationLoginService: AuthServices.loginService,
    verifyLoginService: AuthServices.verifyAuthenticationService,
    refreshLoginService: AuthServices.refreshAuthenticationService,
    switchAccountLoginService: AuthServices.switchAccountService,
    sendResetPasswordEmailService: AuthServices.sendResetPasswordEmailService,
  }
}
