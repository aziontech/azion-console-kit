import { getEnvironmentFromUrl } from '@/helpers'
import { loadContractServicePlan } from '@/services/contract-services'
import { useAccountStore } from '@/stores/account'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function redirectToManager(to, __, next) {
  const accountStore = useAccountStore()
  const isPrivateRoute = !to.meta.isPublic
  const accountData = accountStore.accountData

  try {
    if (accountStore.shouldAvoidCalculateServicePlan) {
      return next()
    }

    if (accountStore.hasActiveUserId && isPrivateRoute) {
      const { isDeveloperSupportPlan } = await loadContractServicePlan({
        clientId: accountData.client_id
      })
      accountStore.setAccountData({ isDeveloperSupportPlan: isDeveloperSupportPlan })
      const isAzionBrand = accountData.kind === 'brand' && accountData.email.includes('@azion.com')
      const allowedToConsoleKit = isDeveloperSupportPlan || isAzionBrand

      if (!allowedToConsoleKit) {
        const environment = getEnvironmentFromUrl(window.location.href)
        let managerLink = 'https://manager.azion.com'
        if (environment === 'stage') {
          managerLink = 'https://stage-manager.azion.com'
        }
        window.location.replace(managerLink)
      }
    }
  } catch {
    return next('/login')
  }
  return next()
}
