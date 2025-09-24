import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'
import { simpleQueryClient } from '@/services/v2/base/queryClient'

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
    await simpleQueryClient.clearSensitiveData()
    accountStore.setAccountData({})
    return true
  }
}
