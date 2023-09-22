import { logout, verify, refresh } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'

const verifyToken = async (times = 1) => {
  try {
    const accountData = await verify()
    return accountData
  } catch {
    if (times > 0) {
      await refresh()
      return await verifyToken(times - 1)
    } else {
      throw new Error('Refresh token failed')
    }
  }
}

export default async function beforeEachRoute(to, _, next) {
  const accountStore = useAccountStore()

  try {
    if (to.path === '/login') return next()
    if (to.path === '/logout') {
      await logout()
      accountStore.setAccountData(null)
      return next()
    }

    const accountData = await verifyToken()
    accountStore.setAccountData(accountData)
    return next()
  } catch {
    next('/login')
  }
}
