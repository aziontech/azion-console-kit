import {
  accountService,
  userService,
  accountSettingsService,
  contractService
} from '@/services/v2/account'
import { DEFAULT_JOB_ROLE } from '@/services/v2/account/job-role-validator'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'

const invalidateAccountCaches = () => {
  queryClient.removeQueries({ queryKey: queryKeys.account.info() })
  queryClient.removeQueries({ queryKey: queryKeys.user.info() })
  queryClient.removeQueries({ queryKey: queryKeys.accountSettings.all })
}

const invalidateBillingDerivedCaches = () => {
  queryClient.removeQueries({ queryKey: queryKeys.billing.all })
  queryClient.removeQueries({ queryKey: queryKeys.contract.all })
}

const clearBillingDerivedFields = (accountStore) => {
  accountStore.setAccountData({
    credit: undefined,
    formatCredit: undefined,
    days: undefined,
    yourServicePlan: undefined,
    isDeveloperSupportPlan: undefined
  })
}

const pickUserSnapshot = (userInfo) => {
  const results = userInfo.results || userInfo
  return {
    is_account_owner: results.is_account_owner,
    client_id: results.client_id,
    timezone: results.timezone,
    utc_offset: results.utc_offset,
    first_name: results.first_name,
    last_name: results.last_name,
    permissions: results.permissions,
    email: results.email,
    user_id: results.id
  }
}

const pickAddressSnapshot = (settings) => {
  if (!settings) return {}
  return {
    postalCode: settings.postalCode,
    country: settings.country,
    region: settings.region,
    city: settings.city,
    address: settings.address,
    complement: settings.complement
  }
}

/**
 * Refresh the account + user + settings caches. Pass `force: true` to drop the Vue Query entries first so the
 * next fetch hits the network (used after plan changes / downgrades).
 *
 * @param {Object} [options]
 * @param {boolean} [options.force=false]
 */
export const loadUserAndAccountInfo = async ({ force = false } = {}) => {
  const accountStore = useAccountStore()

  if (force) {
    invalidateAccountCaches()
    invalidateBillingDerivedCaches()
    clearBillingDerivedFields(accountStore)
  }

  const [accountInfo, userInfo, accountSettingsInfo] = await Promise.all([
    accountService.getAccountInfo(),
    userService.getUserInfo(),
    accountSettingsService.getAccountSettingsInfo().catch(() => null)
  ])

  Object.assign(accountInfo, pickUserSnapshot(userInfo), pickAddressSnapshot(accountSettingsInfo), {
    jobRole: accountSettingsInfo?.jobRole ?? DEFAULT_JOB_ROLE
  })

  accountStore.setAccountData(accountInfo)
  setFeatureFlags(accountInfo.client_flags)
}

export const loadContractData = async ({ force = false } = {}) => {
  const accountStore = useAccountStore()
  const { account } = accountStore

  if (!account?.client_id) return
  if (!force && account.yourServicePlan) return

  if (force) queryClient.removeQueries({ queryKey: queryKeys.contract.all })

  const contractData = await contractService.getContractServicePlan(account.client_id)
  if (!contractData) return

  const { isDeveloperSupportPlan, yourServicePlan } = contractData
  accountStore.setAccountData({ isDeveloperSupportPlan, yourServicePlan })
}

/**
 * Full post-login account hydration. Loads user/account/settings
 * needed to derive `client_id`, `kind`, `first_login`, and `hasServiceOrderPlan`.
 *
 * The accountGuard awaits this BEFORE making redirect decisions so the
 * `needsOnboarding` getter returns correct values the first time it is read.
 */
export const loadAccountHydration = async ({ force = false } = {}) => {
  await loadUserAndAccountInfo({ force })
}
