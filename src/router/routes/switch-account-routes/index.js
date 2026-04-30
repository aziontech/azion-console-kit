import { AccountHandler } from '@/helpers/account-handler'
import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { useAccountStore } from '@/stores/account'
import { trackSignInSafely } from '@/helpers/track-auth-event'
import { inject } from 'vue'

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
    /** @type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
    const tracker = inject('tracker')
    const accountStore = useAccountStore()

    try {
      const EnableSocialLogin = true
      const redirect = await accountHandler.switchAccountFromSocialIdp(
        verify,
        refresh,
        EnableSocialLogin
      )

      const signupTypeFlags = accountStore.getSignupTypeFlags()
      const isSsoLogin = signupTypeFlags.login_sso_google || signupTypeFlags.login_sso_github

      if (isSsoLogin) {
        const { isFirstLogin } = accountStore

        if (!isFirstLogin) {
          const ssoMethod = signupTypeFlags.login_sso_google ? 'google' : 'github'
          await trackSignInSafely({ tracker, method: ssoMethod, loadUserData: true })
        }
      }

      next(redirect)
    } catch {
      next({ name: 'login' })
    }
  }
}
