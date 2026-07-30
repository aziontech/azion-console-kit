import { BaseService } from '@/services/v2/base/query/baseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { userService } from './user-service'
import { accountSettingsService } from './account-settings-service'

const IDENTITY_QUERY_OPTIONS = { persist: false, staleTime: 0 }

export class AccountService extends BaseService {
  baseUrl = 'account/info'

  async fetchAccountInfo() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api' }
    })
    return this._adaptAccountInfo(response.data)
  }

  async getAccountInfo() {
    const queryKey = queryKeys.account.info()
    return await this.useEnsureQueryData(queryKey, async () => this.fetchAccountInfo())
  }

  async fetchAccountIdentity() {
    const [accountInfo, userInfo, accountJobRole] = await Promise.all([
      this.fetchAccountInfo(),
      userService.fetchUserInfo(),
      accountSettingsService.fetchAccountJobRole()
    ])

    return this._mergeIdentity({ accountInfo, userInfo, accountJobRole })
  }

  async getAccountIdentity() {
    const queryKey = queryKeys.account.info()
    return await this.useEnsureQueryData(
      queryKey,
      async () => this.fetchAccountIdentity(),
      IDENTITY_QUERY_OPTIONS
    )
  }

  _mergeIdentity({ accountInfo, userInfo, accountJobRole }) {
    const userResults = userInfo?.results || userInfo || {}

    return {
      ...accountInfo,
      jobRole: accountJobRole?.jobRole,
      is_account_owner: userResults.is_account_owner,
      client_id: userResults.client_id,
      timezone: userResults.timezone,
      utc_offset: userResults.utc_offset,
      first_name: userResults.first_name,
      last_name: userResults.last_name,
      permissions: userResults.permissions,
      email: userResults.email,
      user_id: userResults.id,
      isDeveloperSupportPlan: true
    }
  }

  _adaptAccountInfo(response) {
    if (!response) return response

    return {
      ...response,
      accountTypeIcon: getAccountTypeIcon(response.kind),
      accountTypeName: getAccountTypeName(response.kind)
    }
  }
}

export const accountService = new AccountService()
