import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { AccountSettingsAdapter } from './account-settings-adapter'

export class AccountSettingsService extends BaseService {
  baseUrl = 'v4/iam/account'

  async fetchAccountSettingsInfo() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api' }
    })
    return AccountSettingsAdapter.transformAccountSettings(response.data)
  }

  async getAccountSettingsInfo() {
    const queryKey = queryKeys.accountSettings.info()
    return await this.useEnsureQueryData(queryKey, async () => this.fetchAccountSettingsInfo(), {
      meta: { skipCache: true, persist: false }
    })
  }
}

export const accountSettingsService = new AccountSettingsService()
