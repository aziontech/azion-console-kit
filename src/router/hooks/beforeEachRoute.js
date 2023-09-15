import { logout, verify } from '@/services/login-services'
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
      accountStore.setAccountData(accountData)
      return next()
    }
  } catch {
    next('/login')
  }
}