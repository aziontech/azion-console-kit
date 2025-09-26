import {
  accountService,
  userService,
  accountSettingsService,
  contractService
} from '@/services/v2/account'
import { billingGqlService } from '@/services/v2/billing/billing-gql-service'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'

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
  accountInfo.colorTheme = accountStore.account.colorTheme
  accountInfo.isDeveloperSupportPlan = true
  const isAzionEmail = accountInfo.email.endsWith('@azion.com')
  if (isAzionEmail) {
    accountInfo.client_flags.push('is_azion_email')
  }
  accountStore.setAccountData(accountInfo)
  setFeatureFlags(accountInfo.client_flags)
}

export const loadProfileAndAccountInfo = async () => {
  const accountStore = useAccountStore()
  const accountInfo = accountStore.account

  const promises = [
    billingGqlService.getCreditAndExpirationDate().then(({ credit, formatCredit, days }) => {
      accountStore.setAccountData({
        credit,
        formatCredit,
        days
      })
    }),

    accountInfo.client_id
      ? contractService
          .getContractServicePlan(accountInfo.client_id, { prefetch: true })
          .then(({ isDeveloperSupportPlan, yourServicePlan }) => {
            accountStore.setAccountData({
              isDeveloperSupportPlan,
              yourServicePlan
            })
          })
      : Promise.resolve()
  ]

  await Promise.all(promises)
}
