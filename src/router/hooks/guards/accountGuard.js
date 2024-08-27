import { getAccountInfoService, getUserInfoService } from '@/services/account-services'
import { loadAccountJobRoleService } from '@/services/account-settings-services'
import { useAccountStore } from '@/stores/account'
import { setRedirectRoute } from '@/helpers'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard(to, next) {
  const accountStore = useAccountStore()
  const isPrivateRoute = !to.meta.isPublic
  const userNotIsLoggedIn = !accountStore.hasActiveUserId

  if (userNotIsLoggedIn && isPrivateRoute) {
    try {
      const [accountInfo, userInfo, accountJobRole] = await Promise.all([
        getAccountInfoService(),
        getUserInfoService(),
        loadAccountJobRoleService()
      ])

      accountInfo.is_account_owner = userInfo.results.is_account_owner
      accountInfo.client_id = userInfo.results.client_id
      accountInfo.timezone = userInfo.results.timezone
      accountInfo.utc_offset = userInfo.results.utc_offset
      accountInfo.permissions = userInfo.results.permissions
      accountInfo.email = userInfo.results.email
      accountInfo.user_id = userInfo.results.id
      accountInfo.colorTheme = accountStore.theme
      accountInfo.jobRole = accountJobRole.jobRole

      accountStore.setAccountData(accountInfo)
    } catch {
      setRedirectRoute(to)
      return next('/login')
    }
  }
}
