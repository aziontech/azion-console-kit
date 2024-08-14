import { logoutService } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard(to, next) {
  if (to.path === '/logout') {
    await logoutService()
    const accountStore = useAccountStore()
    accountStore.setAccountData({})
    return next()
  }
}
