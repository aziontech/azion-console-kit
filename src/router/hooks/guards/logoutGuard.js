import { logoutService } from '@/services/auth-services'
import { useLoadingStore } from '@/stores/loading'
import { BaseService } from '@/services/v2/base/query/baseService'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, accountStore, tracker }) {
  const loadingStore = useLoadingStore()
  loadingStore.startLoading()

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (to.path === '/logout' || to.query.ref === 'logout') {
    tracker.reset()
    await logoutService()
    const baseService = new BaseService()
    await baseService.clearAll()
    accountStore.setAccountData({})
    return { name: 'login' }
  }
}
