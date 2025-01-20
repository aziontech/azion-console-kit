import { AccountHandler } from '@/helpers/account-handler'
import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'

/** @type {import('vue-router').RouteRecordRaw} */
export const switchAccountRoutes = {
  path: '/switch-account',
  name: 'switch-account',
  meta: {
    isPublic: true
  },
  beforeEnter: async (__, ___, next) => {
    const accountHandler = new AccountHandler(
      AuthServices.switchAccountService,
      listTypeAccountService
    )
    const verify = AuthServices.verifyAuthenticationService
    const refresh = AuthServices.refreshAuthenticationService

    try {
      const EnableSocialLogin = true
      const redirect = await accountHandler.switchAccountFromSocialIdp(
        verify,
        refresh,
        EnableSocialLogin
      )
      next(redirect)
    } catch {
      next({ name: 'login' })
    }
  }
}
