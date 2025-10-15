import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'
import { BaseService } from '@/services/v2/base/query/baseService'

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
        const baseService = new BaseService()
        await baseService.clearByType('SENSITIVE')
        return '/login'
      }
    }
  }
}
