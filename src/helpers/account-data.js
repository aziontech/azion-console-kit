import {
  accountService,
  userService,
  accountSettingsService,
  contractService
} from '@/services/v2/account'
import { billingGqlService } from '@/services/v2/billing/billing-gql-service'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'
import { sessionManager } from '@/services/v2/base/auth'

export const loadUserAndAccountInfo = async () => {
  const accountStore = useAccountStore()
  const [accountInfo, userInfo, accountJobRole] = await Promise.all([
    accountService.getAccountInfo(),
    userService.getUserInfo(),
    accountSettingsService.getAccountJobRole()
  ])
  accountInfo.jobRole = accountJobRole.jobRole
  const userResults = userInfo.results || userInfo
  accountInfo.is_account_owner = userResults.is_account_owner
  accountInfo.client_id = userResults.client_id
  accountInfo.timezone = userResults.timezone
  accountInfo.utc_offset = userResults.utc_offset
  accountInfo.first_name = userResults.first_name
  accountInfo.last_name = userResults.last_name
  accountInfo.permissions = userResults.permissions
  accountInfo.email = userResults.email
  accountInfo.user_id = userResults.id
  accountInfo.isDeveloperSupportPlan = true

  accountStore.setAccountData(accountInfo)
  setFeatureFlags(accountInfo.client_flags)

  sessionManager.afterLogin()
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
