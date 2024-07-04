import checkAccountStatus from '@/helpers/account-expired'
import { getAccountInfoService, getUserInfoService } from '@/services/account-services'
import { loadAccountJobRoleService } from '@/services/account-settings-services'
import { logoutService } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'
import { useHelpCenterStore } from '@/stores/help-center'
import { useLoadingStore } from '@/stores/loading'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function beforeEachRoute(to, __, next) {
  const accountStore = useAccountStore()
  const loadingStore = useLoadingStore()
  const helpCenterStore = useHelpCenterStore()

  helpCenterStore.close()

  // TODO: remove the usage of localStorage when API returns the theme
  const theme = localStorage.getItem('theme')

  const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  accountStore.setTheme(theme || fallbackTheme)

  if (to.path === '/logout') {
    await logoutService()
    accountStore.setAccountData({})
    return next()
  }

  loadingStore.startLoading()

  if (to.meta?.hideLoading) {
    loadingStore.finishLoading()
  }

  if (!accountStore.hasActiveUserId && !to.meta.isPublic) {
    try {
      const [accountInfo, userInfo, accountJobRole] = await Promise.all([
        getAccountInfoService(),
        getUserInfoService(),
        loadAccountJobRoleService()
      ])

      checkAccountStatus(accountInfo.status)

      accountInfo.is_account_owner = userInfo.results.is_account_owner
      accountInfo.client_id = userInfo.results.client_id
      accountInfo.timezone = userInfo.results.timezone
      accountInfo.utc_offset = userInfo.results.utc_offset
      accountInfo.permissions = userInfo.results.permissions
      accountInfo.email = userInfo.results.email
      accountInfo.user_id = userInfo.results.id
      accountInfo.colorTheme = theme || fallbackTheme
      accountInfo.jobRole = accountJobRole.jobRole

      accountStore.setAccountData(accountInfo)

      if (accountInfo.status !== 'BLOCKED') {
        return next('/billing/payment?paymentSession=true')
      }

      return next()
    } catch {
      return next('/login')
    }
  }

  return next()
}
