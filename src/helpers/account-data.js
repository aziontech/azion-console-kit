import { getAccountInfoService, getUserInfoService } from '@/services/account-services'
import { loadAccountJobRoleService } from '@/services/account-settings-services'
import { billingGqlService } from '@/services/v2'
import { loadContractServicePlan } from '@/services/contract-services'
import { useAccountStore } from '@/stores/account'
import { setFeatureFlags } from '@/composables/user-flag'

export const loadUserAndAccountInfo = async () => {
  const accountStore = useAccountStore()
  const [accountInfo, userInfo] = await Promise.all([getAccountInfoService(), getUserInfoService()])

  accountInfo.is_account_owner = userInfo.results.is_account_owner
  accountInfo.client_id = userInfo.results.client_id
  accountInfo.timezone = userInfo.results.timezone
  accountInfo.utc_offset = userInfo.results.utc_offset
  accountInfo.first_name = userInfo.results.first_name
  accountInfo.last_name = userInfo.results.last_name
  accountInfo.permissions = userInfo.results.permissions
  accountInfo.email = userInfo.results.email
  accountInfo.user_id = userInfo.results.id
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
    loadAccountJobRoleService().then(({ jobRole }) => {
      accountStore.setAccountData({
        jobRole
      })
    }),

    billingGqlService.getCreditAndExpirationDate().then(({ credit, formatCredit, days }) => {
      accountStore.setAccountData({
        credit,
        formatCredit,
        days
      })
    }),

    accountInfo.client_id
      ? loadContractServicePlan({
          clientId: accountInfo.client_id
        }).then(({ isDeveloperSupportPlan, yourServicePlan }) => {
          accountStore.setAccountData({
            isDeveloperSupportPlan,
            yourServicePlan
          })
        })
      : Promise.resolve()
  ]

  await Promise.all(promises)
}
