import { loadUserAndAccountInfo } from '@/helpers/account-data'
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
      await loadUserAndAccountInfo()

      // Check if needs service order plan
      const needsServiceOrder = accountStore.hasServiceOrderPlan === false
      const isAdditionalDataRoute = to.name === 'additional-data'

      // If needs service order and not on additional-data route, redirect
      if (needsServiceOrder && !isAdditionalDataRoute) {
        return { name: 'additional-data' }
      }

      // If doesn't need service order and trying to access additional-data, go to home
      if (!needsServiceOrder && isAdditionalDataRoute) {
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
