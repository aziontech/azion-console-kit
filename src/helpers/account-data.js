import { accountService, contractService } from '@/services/v2/account'
import { billingGqlService } from '@/services/v2/billing/billing-gql-service'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'

export const loadUserAndAccountInfo = async () => {
  const accountStore = useAccountStore()
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

export const loadContractData = async () => {
  const accountStore = useAccountStore()
  const { account } = accountStore

  if (!account?.client_id) return
  if (account.yourServicePlan) return

  const contractData = await contractService.getContractServicePlan(account.client_id)
  if (!contractData) return

  const { isDeveloperSupportPlan, yourServicePlan } = contractData
  accountStore.setAccountData({ isDeveloperSupportPlan, yourServicePlan })
}
