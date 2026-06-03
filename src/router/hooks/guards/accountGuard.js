import { loadAccountHydration } from '@/helpers/account-data'
import { setRedirectRoute } from '@/helpers'
import { sessionManager } from '@/services/v2/base/auth'
import { ensurePlansList } from '@/composables/usePlansService'
import { ensureServiceOrdersList } from '@/composables/useServiceOrdersList'
import { SO_ENTITLED_STATUSES } from '@/services/v2/service-orders/service-orders-constants'

/** @type {import('vue-router').NavigationGuardWithThis} */
export async function accountGuard({ to, accountStore, tracker }) {
  const userNotIsLoggedIn = !accountStore.hasActiveUserId
  const isPrivateRoute = !to.meta.isPublic

  if (userNotIsLoggedIn && isPrivateRoute) {
    if (!accountStore.hasSession) {
      setRedirectRoute(to)
      return '/login'
    }

    try {
      // Awaiting full hydration (account+user+settings+SO+billing+contract)
      // ensures `needsOnboarding` and `hasAccessConsole` reflect real state
      // by the time the redirect decision below executes. Without this, the
      // guard would race the contract/billing fetches.
      await loadAccountHydration()
      sessionManager.afterLogin()

      const accountId = accountStore.accountData?.id
      const serviceOrdersResponse = await ensureServiceOrdersList(accountId).catch(() => null)
      const serviceOrders = serviceOrdersResponse?.data ?? []
      const hasActivePlan = serviceOrders.some((so) =>
        SO_ENTITLED_STATUSES.includes(so.status)
      )
      accountStore.setHasActivePlan(hasActivePlan)

      const needsOnboarding = accountStore.needsOnboarding
      const isAdditionalDataRoute = to.name === 'additional-data'

      if (needsOnboarding && !isAdditionalDataRoute) {
        ensurePlansList().catch(() => {})
        return { name: 'additional-data' }
      }

      if (!needsOnboarding && isAdditionalDataRoute) {
        return { name: 'home' }
      }

      if (to.meta.isPublic) {
        return '/'
      }
    } catch {
      setRedirectRoute(to)
      await tracker.reset()
      await sessionManager.logout()
      return '/login'
    }
  }
}
