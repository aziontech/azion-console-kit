import { getEnvironment } from '@/helpers'
import { loadContractServicePlan } from '@/services/contract-services'
import { useAccountStore } from '@/stores/account'

/** @type {import('vue-router').NavigationGuardWithThis} */
export default async function redirectToManager(to, __, next) {
  const accountStore = useAccountStore()
  const isPrivateRoute = !to.meta.isPublic
  const accountData = accountStore.accountData

  if (accountStore.shouldAvoidCalculateServicePlan) {
    return next()
  }

  try {
    if (accountStore.hasActiveUserId && isPrivateRoute) {
      const isNotClientKind = !accountData.client_id

      if (isNotClientKind) {
        const isAzionBrand =
          accountData.kind === 'brand' && accountData.email.includes('@azion.com')

        if (isAzionBrand) {
          return next()
        } else {
          permanentRedirectToManager()
        }
      }

      const { isDeveloperSupportPlan } = await loadContractServicePlan({
        clientId: accountData.client_id
      })
      accountStore.setAccountData({ isDeveloperSupportPlan: isDeveloperSupportPlan })

      if (!isDeveloperSupportPlan) {
        permanentRedirectToManager()
      }
    }
  } catch {
    return next()
  }
  return next()
}

function permanentRedirectToManager() {
  const environment = getEnvironment()
  if (environment !== 'development') {
    const subdomain = environment === 'production' ? 'manager' : 'stage-manager'

    window.location.replace(`https://${subdomain}.azion.com`)
  }
}
