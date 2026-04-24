import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'
import { sessionManager } from '@/services/v2/base/auth'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, from, accountStore, tracker }) {
  const loadingStore = useLoadingStore()

  // Only show loading for actual route changes, not query-only updates
  // This prevents component unmounting during query param updates
  const isQueryOnlyChange = to.path === from?.path && to.name === from?.name

  if (!isQueryOnlyChange) {
    loadingStore.startLoading()
  }

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (to.path === '/logout' || to.query.ref === 'logout') {
    loadingStore.startLoading()
    tracker.reset()
    await sessionManager.logout()
    await logoutService()
    accountStore.resetAccount()
    return { name: 'login' }
  }
}
