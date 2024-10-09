import { logoutService } from '@/services/auth-services'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function logoutGuard({ to, accountStore, tracker }) {
  if (to.path === '/logout') {
    tracker.reset()
    await logoutService()
    accountStore.setAccountData({})
    return true
  }
}
