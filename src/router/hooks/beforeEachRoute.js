import { getAccountInfo, getUserInfo } from '@/services/account-services'
import { logout } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'
import { tracking } from '../../tracking-factory'

function identifyUser(accountInfo) {
  if (accountInfo.kind === 'client') {
    const traits = { client_id: accountInfo.client_id }
    tracking.assignTraits(traits)
  }

  const userID = accountInfo.user_id
  const props = { client_status: accountInfo.status }
  tracking.identify(userID, props)
}

export default async function beforeEachRoute(to, _, next) {
  const accountStore = useAccountStore()

  if (to.path === '/logout') {
    await logout()
    accountStore.setAccountData(null)
    return next()
  }

  if (!accountStore.hasActiveUserId && to.path !== '/login') {
    try {
      const [accountInfo, userInfo] = await Promise.all([getAccountInfo(), getUserInfo()])

      accountInfo.is_account_owner = userInfo.results.is_account_owner
      accountInfo.client_id = userInfo.results.client_id
      accountInfo.timezone = userInfo.results.timezone
      accountInfo.utc_offset = userInfo.results.utc_offset
      accountInfo.permissions = userInfo.results.permissions
      accountInfo.email = userInfo.results.email
      accountInfo.user_id = userInfo.results.id

      accountStore.setAccountData(accountInfo)
    } catch {
      return next('/login')
    }
  }

  identifyUser(accountStore.getAccountData)
  return next()
}
