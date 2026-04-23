import { AccountHandler } from '@/helpers/account-handler'
import * as AuthServices from '@/services/auth-services'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { useAccountStore } from '@/stores/account'
import { loadUserAndAccountInfo } from '@/helpers/account-data'
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

      // Track SSO sign-in for returning users (not first login)
      const signupTypeFlags = accountStore.getSignupTypeFlags()
      const isSsoLogin = signupTypeFlags.login_sso_google || signupTypeFlags.login_sso_github

      if (isSsoLogin) {
        // Load user data to check firstLogin status and for HubSpot tracking
        await loadUserAndAccountInfo()
        const { userId: consoleUserId, accountData, isFirstLogin } = accountStore

        // Only track sign-in for returning users (first login is tracked in signup-routes)
        if (!isFirstLogin) {
          const ssoMethod = signupTypeFlags.login_sso_google ? 'google' : 'github'

          tracker.signIn
            .userSignedIn({
              method: ssoMethod,
              signupTypeFlags,
              email: accountData?.email,
              userId: consoleUserId,
              firstname: accountData?.first_name,
              lastname: accountData?.last_name,
              company: accountData?.company_name,
              githubHandle: ssoMethod === 'github' ? accountData?.github_handle : undefined
            })
            .track()
        }
      }

      next(redirect)
    } catch {
      next({ name: 'login' })
    }
  }
}
