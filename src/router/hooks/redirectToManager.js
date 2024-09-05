import { getEnvironment, getStaticUrlsByEnvironment } from '@/helpers'
import { loadContractServicePlan } from '@/services/contract-services'
import { useAccountStore } from '@/stores/account'
import { listClientIdsReleasedForConsoleService } from '@/services/account-services'

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
      const isAzion = accountData.email.includes('@azion.com')
      // Azion internal access to console.
      if (isAzion) {
        return next()
      }
      const isNotClientKind = !accountData.client_id
      // [Brand,Reseller,Group] are the kins without client id.
      if (isNotClientKind && !isAzion) {
        permanentRedirectToManager()
        //ensure that in development env, without redirect, you continue to next route.
        return next()
      }

      // account that are kind client, can access with developer service plan
      const [{ isDeveloperSupportPlan }, clientIdsReleadesForConsole] = await Promise.all([
        loadContractServicePlan({ clientId: accountData.client_id }),
        listClientIdsReleasedForConsoleService()
      ])
      accountStore.setAccountData({ isDeveloperSupportPlan: isDeveloperSupportPlan })
      if (!isDeveloperSupportPlan) {
        if (clientIdsReleadesForConsole.includes(accountData.client_id)) {
          return next()
        }
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
