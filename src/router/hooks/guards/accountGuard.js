import { loadUserAndAccountInfo } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'
import { clearCacheAccountSpecific } from '@/services/v2/base/query/queryClient'
import { cleanupLegacyDatabases } from '@/services/v2/base/query/indexedDbCleanup'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const userNotIsLoggedIn = !accountStore.hasActiveUserId
  const isPrivateRoute = !to.meta.isPublic

  if (userNotIsLoggedIn) {
    if (isPrivateRoute) {
      try {
        await loadUserAndAccountInfo()

        cleanupLegacyDatabases()

        if (to.meta.isPublic) {
          return '/'
        }
      } catch {
        setRedirectRoute(to)
        await tracker.reset()
        await clearCacheAccountSpecific()
        return '/login'
      }
    }
  }
}
