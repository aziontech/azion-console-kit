import * as LoginService from '@/services/login-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const loginRoutes = {
  path: '/login',
  name: 'login',
  component: () => import('@views/Login/LoginView.vue'),
  props: {
    authenticationLoginService: LoginService.authenticate,
    verifyLoginService: LoginService.verify,
    refreshLoginService: LoginService.refresh,
    switchAccountLoginService: LoginService.switchAccount
  }
}
