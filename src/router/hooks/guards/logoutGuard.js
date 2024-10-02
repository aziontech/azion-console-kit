import { logoutService } from '@/services/auth-services'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, accountStore }) {
  if (to.path === '/logout') {
    await logoutService()
    accountStore.setAccountData({})
    return true
  }
}
