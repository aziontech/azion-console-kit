import { BaseService } from '@/services/v2/base/query/baseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { userService } from './user-service'
import { accountSettingsService } from './account-settings-service'

const IDENTITY_QUERY_OPTIONS = { persist: false, staleTime: 0 }

const BILLING_TYPE_STORAGE_KEY = 'billing_type_override'

const BILLING_TYPES = ['plan', 'internal', 'custom']

const readStoredBillingType = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    return window.localStorage.getItem(BILLING_TYPE_STORAGE_KEY)
  } catch {
    return null
  }
}

const normalizeConfiguredBillingType = (value) => {
  if (value === null || value === undefined || value === '') return undefined
  if (value === 'null') return null
  return BILLING_TYPES.includes(value) ? value : undefined
}

const resolveBillingType = (billingType) => {
  const configuredSources = [
    import.meta.env.VITE_BILLING_TYPE,
    import.meta.env.VITE_BILLING_TYPE_OVERRIDE,
    readStoredBillingType()
  ]

  for (const source of configuredSources) {
    const configured = normalizeConfiguredBillingType(source)
    if (configured !== undefined) return { value: configured, isOverridden: true }
  }

  return { value: billingType ?? null, isOverridden: false }
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

    const billingType = resolveBillingType(response.billing_type)

    return {
      ...response,
      billing_type: billingType.value,
      billing_type_overridden: billingType.isOverridden,
      accountTypeIcon: getAccountTypeIcon(response.kind),
      accountTypeName: getAccountTypeName(response.kind)
    }
  }
}

export const accountService = new AccountService()
