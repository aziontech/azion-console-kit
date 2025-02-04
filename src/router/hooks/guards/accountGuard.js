import { setRedirectRoute } from '@/helpers'
import { loadUserAndAccountInfo } from '@/helpers/account-data'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const isPrivateRoute = !to.meta.isPublic
  const userNotIsLoggedIn = !accountStore.hasActiveUserId

  if (userNotIsLoggedIn) {
    try {
      await loadUserAndAccountInfo()

      if (!isPrivateRoute) {
        return '/'
      }
    } catch {
      if (!isPrivateRoute) return
      setRedirectRoute(to)
      await tracker.reset()
      return '/login'
    }
  }
}
