import { loadAccountHydration } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'
import { sessionManager } from '@/services/v2/base/auth'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const userNotIsLoggedIn = !accountStore.hasActiveUserId
  const isPrivateRoute = !to.meta.isPublic

  if (userNotIsLoggedIn && isPrivateRoute) {
    if (!accountStore.hasSession) {
      setRedirectRoute(to)
      return '/login'
    }

    try {
      // Awaiting full hydration (account+user+settings+SO+billing+contract)
      // ensures `needsOnboarding` and `hasAccessConsole` reflect real state
      // by the time the redirect decision below executes. Without this, the
      // guard would race the contract/billing fetches.
      await loadAccountHydration()
      sessionManager.afterLogin()

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
