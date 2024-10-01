import { getEnvironment, getStaticUrlsByEnvironment } from '@/helpers'

export async function redirectToManagerGuard({to, from, accountStore, loadContractServicePlan}) {  
  const isPrivateRoute = !to.meta.isPublic
  const accountData = accountStore.accountData

  try {
    if (accountStore.hasActiveUserId && isPrivateRoute) {
      const isAzion = accountData.email.includes('@azion.com')

      if (isAzion || accountStore.hasAccessConsole) {
        return true
      }

      if (accountStore.metricsOnlyAccessRestriction) {
        return handleNavigationRestriction(to, from)
      }

      const isNotClientKind = !accountData.client_id
      // [Brand,Reseller,Group] are the kins without client id.
      if (isNotClientKind) {
        return permanentRedirectToManager()
        //ensure that in development env, without redirect, you continue to next route.
      }

      // account that are kind client, can access with developer service plan
      const { isDeveloperSupportPlan } = await loadContractServicePlan({
        clientId: accountData.client_id
      })

      accountStore.setAccountData({
        isDeveloperSupportPlan: isDeveloperSupportPlan
      })

      if (!isDeveloperSupportPlan) {
        return permanentRedirectToManager()
      }
    }
  } catch {
    return true
  }
  return true
}

function permanentRedirectToManager() {
  const environment = getEnvironment()
  if (environment !== 'development') {
    const managerUrl = getStaticUrlsByEnvironment('manager')
    window.location.replace(managerUrl)
  }
}

function handleNavigationRestriction(to, from) {
  const metricsRouteName = 'real-time-metrics'
  const isNotNavigatingToMetrics = to.name !== metricsRouteName
  const isNavigatingFromMetrics = from.name === metricsRouteName

  if (isNotNavigatingToMetrics) {
    if (isNavigatingFromMetrics) {
      return false
    }
    return { name: metricsRouteName }
  }

  return true
}
