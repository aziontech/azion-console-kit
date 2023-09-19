import { logout, verify } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'

export default async function beforeEachRoute(to, _, next) {
  const accountStore = useAccountStore()

  try {
    if (to.path === '/login') return next()
    if (to.path === '/logout') {
      await logout()
      accountStore.setAccountData(null)
      return next()
    }

    const accountData = await verify()

    if (accountData) {
      next()
      accountStore.setAccountData(accountData)
    }
  } catch {
    next('/login')
  }
}
