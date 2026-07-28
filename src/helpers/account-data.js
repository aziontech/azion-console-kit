import { accountService, contractService } from '@/services/v2/account'
import { billingGqlService } from '@/services/v2/billing-legacy/accounting/billing-gql-service'
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

/**
 * Refresh the account identity (account + user + job role) as a single source of truth. Pass `force: true`
 * to drop the Vue Query entries first so the next fetch hits the network (used after plan changes / downgrades).
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

  const identity = await accountService.getAccountIdentity()

  accountStore.setIdentity(identity)
  setFeatureFlags(identity.client_flags)
}

export const loadBillingData = async () => {
  const accountStore = useAccountStore()
  const { account, accountIsNotRegular } = accountStore

  if (!accountIsNotRegular) return
  if (account.formatCredit) return

  const billingData = await billingGqlService.getCreditAndExpirationDate()
  if (!billingData) return

  const { credit, formatCredit, days } = billingData
  accountStore.setAccountData({ credit, formatCredit, days })
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
 * Full post-login account hydration. Loads the account identity
 * needed by redirects, feature flags, and the plan gate.
 *
 * The accountGuard awaits this BEFORE making redirect decisions so the
 * `needsOnboarding` getter returns correct values the first time it is read.
 */
export const loadAccountHydration = async ({ force = false } = {}) => {
  await loadUserAndAccountInfo({ force })
}
