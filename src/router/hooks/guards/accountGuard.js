import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const userNotIsLoggedIn = !accountStore.hasActiveUserId
  const isPrivateRoute = !to.meta.isPublic

  if (userNotIsLoggedIn) {
    if (isPrivateRoute) {
      try {
        await loadUserAndAccountInfo()
        if (to.meta.isPublic) {
          return '/'
        }
      } catch {
        setRedirectRoute(to)
        await tracker.reset()
        return '/login'
      }
    }
  }
}
