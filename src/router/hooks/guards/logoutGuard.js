import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'
import { sessionManager } from '@/services/v2/base/auth'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, accountStore, tracker }) {
  const loadingStore = useLoadingStore()
  loadingStore.startLoading()

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (to.path === '/logout' || to.query.ref === 'logout') {
    tracker.reset()
    await sessionManager.logout()
    await logoutService()
    queryClient.clearAll()
    accountStore.setAccountData({})
    return { name: 'login' }
  }
}
