import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'
import { sessionManager } from '@/services/v2/base/auth'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, from, accountStore, tracker }) {
  const loadingStore = useLoadingStore()
  const isComingFromAuthRoute = from.meta?.hideNavigation
  const shouldShowLoading =
    accountStore.hasSession && !to.meta?.hideNavigation && !isComingFromAuthRoute

  if (shouldShowLoading) {
    loadingStore.startLoading()
  }

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (to.path === '/logout' || to.query.ref === 'logout') {
    tracker.reset()
    await sessionManager.logout()
    await logoutService()
    accountStore.resetAccount()
    return { name: 'login' }
  }
}
