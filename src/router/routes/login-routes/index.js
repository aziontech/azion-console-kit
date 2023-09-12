import * as LoginService from '@/services/login-services'

const { DEV } = import.meta.env

/** @type {import('vue-router').RouteRecordRaw} */
export const loginRoutes = {
  /* 
    Workaround to handle the login method in dev mode because when in "production" 
    the login method is handled by the edge application
  */ 
  path: DEV ? '/login' : '/login-dev',
  name: DEV ? 'login' : 'login-dev',

  component: () => import('@views/Login/LoginView.vue'),
  props: {
    authenticationLoginService: LoginService.authenticate,
    verifyLoginService: LoginService.verify,
    refreshLoginService: LoginService.refresh,
    switchAccountLoginService: LoginService.switchAccount
  }
}
