import { BaseService } from '@/services/v2/base/query/baseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'
import { CACHE_TYPE } from '@/services/v2/base/query/config'

export const accountKeys = {
  all: ['account'],
  info: () => [...accountKeys.all, 'info']
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

  async getAccountInfo(options = {}) {
    const queryKey = accountKeys.info()
    const queryFn = async () => {
      return this.fetchAccountInfo()
    }
    const meta = {
      cacheType: CACHE_TYPE.SENSITIVE
    }
    return this._ensureQueryData(queryKey, queryFn, meta, options)
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
