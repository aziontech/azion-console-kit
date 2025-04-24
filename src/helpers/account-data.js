import { getAccountInfoService, getUserInfoService } from '@/services/account-services'
import { loadAccountJobRoleService } from '@/services/account-settings-services'
import { loadContractServicePlan } from '@/services/contract-services'
import { useAccountStore } from '@/stores/account'

export const loadUserAndAccountInfo = async () => {
  const accountStore = useAccountStore()
  const [accountInfo, userInfo, accountJobRole] = await Promise.all([
    getAccountInfoService(),
    getUserInfoService(),
    loadAccountJobRoleService()
  ])

  accountInfo.is_account_owner = userInfo.results.is_account_owner
  accountInfo.client_id = userInfo.results.client_id
  accountInfo.timezone = userInfo.results.timezone
  accountInfo.utc_offset = userInfo.results.utc_offset
  accountInfo.first_name = userInfo.results.first_name
  accountInfo.last_name = userInfo.results.last_name
  accountInfo.permissions = userInfo.results.permissions
  accountInfo.email = userInfo.results.email
  accountInfo.user_id = userInfo.results.id
  accountInfo.colorTheme = accountStore.theme
  accountInfo.jobRole = accountJobRole.jobRole
  accountInfo.isDeveloperSupportPlan = true

  if (accountInfo.client_id) {
    const { isDeveloperSupportPlan, yourServicePlan } = await loadContractServicePlan({
      clientId: accountInfo.client_id
    })
    accountInfo.isDeveloperSupportPlan = isDeveloperSupportPlan
    accountInfo.yourServicePlan = yourServicePlan
  }

  accountStore.setAccountData(accountInfo)
}
