import { BaseService } from '@/services/v2/base/query/baseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { userService } from './user-service'
import { accountSettingsService } from './account-settings-service'

const IDENTITY_QUERY_OPTIONS = { persist: false, staleTime: 0 }

const BILLING_TYPE_OVERRIDE_KEY = 'billing_type_override'

const readLocalStorageOverride = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(BILLING_TYPE_OVERRIDE_KEY)
  } catch {
    return null
  }
}

const resolveBillingType = (billingType) => {
  const envOverride = import.meta.env.VITE_BILLING_TYPE_OVERRIDE
  const override = !envOverride ? readLocalStorageOverride() : envOverride

  if (!override) {
    return billingType ?? null
  }

  return override === 'null' ? null : override
}

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
    return await this.useEnsureQueryData(queryKey, async () => this.fetchAccountInfo(), {
      meta: { skipCache: true, persist: false }
    })
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
      billing_type: resolveBillingType(response.billing_type),
      hasServiceOrderPlan: response.has_service_order_plan === true,
      accountTypeIcon: getAccountTypeIcon(response.kind),
      accountTypeName: getAccountTypeName(response.kind)
    }
  }
}

export const accountService = new AccountService()
