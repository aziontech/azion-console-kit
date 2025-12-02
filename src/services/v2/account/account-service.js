import { BaseService } from '@/services/v2/base/query/baseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'

export const accountKeys = { all: ['account'], info: () => [...accountKeys.all, 'info'] }

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
    const queryKey = accountKeys.info()
    return await this._ensureQueryData(queryKey, async () => this.fetchAccountInfo(), {
      cacheType: this.cacheType.SENSITIVE
    })
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
