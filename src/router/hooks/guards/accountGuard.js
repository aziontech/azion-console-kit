import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'
import { sessionManager } from '@/services/v2/base/auth'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const userNotIsLoggedIn = !accountStore.hasActiveUserId
  const isPrivateRoute = !to.meta.isPublic

  if (userNotIsLoggedIn && isPrivateRoute) {
    if (!accountStore.hasSession) {
      if (import.meta.env.VITE_DEBUG_LOGIN === 'true') {
        accountStore.setHasSession(true)
      } else {
        setRedirectRoute(to)
        return '/login'
      }
    }

    try {
      await loadUserAndAccountInfo()
      sessionManager.afterLogin()

      const needsOnboarding = accountStore.needsOnboarding
      const isAdditionalDataRoute = to.name === 'additional-data'

      if (needsOnboarding && !isAdditionalDataRoute) {
        return { name: 'additional-data' }
      }

      if (!needsOnboarding && isAdditionalDataRoute) {
        return { name: 'home' }
      }

      if (to.meta.isPublic) {
        return '/'
      }
    } catch {
      setRedirectRoute(to)
      await tracker.reset()
      await sessionManager.logout()
      return '/login'
    }
  }
}
