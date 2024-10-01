import { getEnvironment, getStaticUrlsByEnvironment } from '@/helpers'

export default async function redirectToManager(routeHandler, guardDependency) {
  const { to, from, next } = routeHandler
  const { accountStore, loadContractServicePlan } = guardDependency
  const isPrivateRoute = !to.meta.isPublic
  const accountData = accountStore.accountData

  try {
    if (accountStore.hasActiveUserId && isPrivateRoute) {
      const isAzion = accountData.email.includes('@azion.com')
      // Azion internal access to console.
      if (isAzion || accountStore.hasAccessConsole) {
        return next()
      }

      if (accountStore.metricsOnlyAccessRestriction) {
        return handleNavigationRestriction(to, from, next)
      }

      const isNotClientKind = !accountData.client_id
      // [Brand,Reseller,Group] are the kins without client id.
      if (isNotClientKind && !isAzion) {
        permanentRedirectToManager()
        //ensure that in development env, without redirect, you continue to next route.
        return next()
      }

      // account that are kind client, can access with developer service plan
      const { isDeveloperSupportPlan } = await loadContractServicePlan({
        clientId: accountData.client_id
      })

      accountStore.setAccountData({
        isDeveloperSupportPlan: isDeveloperSupportPlan
      })

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
    const managerUrl = getStaticUrlsByEnvironment('manager')
    window.location.replace(managerUrl)
  }
}

function handleNavigationRestriction(to, from, next) {
  const metricsRouteName = 'real-time-metrics'
  const isNotNavigatingToMetrics = to.name !== metricsRouteName
  const isNavigatingFromMetrics = from.name === metricsRouteName

  if (isNotNavigatingToMetrics) {
    if (isNavigatingFromMetrics) {
      return next(false)
    }
    return next({ name: metricsRouteName })
  }

  return next()
}
