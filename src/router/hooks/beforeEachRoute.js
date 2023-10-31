import { getUserInfoService, getAccountInfoService } from '@/services/account-services'
import { logoutService } from '@/services/auth-services'
import { useAccountStore } from '@/stores/account'

export default async function beforeEachRoute(to, _, next) {
  const accountStore = useAccountStore()

  // TODO: remove the usage of localStorage when API returns the theme
  const theme = localStorage.getItem('theme')

  const fallbackTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

  if (to.path === '/logout') {
    await logoutService()
    accountStore.setAccountData({})
    return next()
  }

  const isNotLoginRoute = to.path !== '/login'
  const isNotResetPasswordRoute = to.name !== 'reset-password'

  if (!accountStore.hasActiveUserId && isNotLoginRoute && isNotResetPasswordRoute) {
    try {
      const [accountInfo, userInfo] = await Promise.all([
        getAccountInfoService(),
        getUserInfoService()
      ])

      accountInfo.is_account_owner = userInfo.results.is_account_owner
      accountInfo.client_id = userInfo.results.client_id
      accountInfo.timezone = userInfo.results.timezone
      accountInfo.utc_offset = userInfo.results.utc_offset
      accountInfo.permissions = userInfo.results.permissions
      accountInfo.email = userInfo.results.email
      accountInfo.user_id = userInfo.results.id

      accountInfo.colorTheme = theme || fallbackTheme

      accountStore.setAccountData(accountInfo)
      return next()
    } catch {
      return next('/login')
    }
  }

  accountStore.setTheme(theme || fallbackTheme)
  return next()
}
