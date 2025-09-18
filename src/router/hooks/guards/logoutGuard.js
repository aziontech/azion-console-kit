import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, accountStore, tracker }) {
  const loadingStore = useLoadingStore()
  loadingStore.startLoading()

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }
  
  if (to.path === '/logout') {
    tracker.reset()
    await logoutService()
    accountStore.setAccountData({})
    return true
  }
}
