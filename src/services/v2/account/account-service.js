import { BaseService } from '../base/BaseService'
import { getAccountTypeIcon, getAccountTypeName } from '@/helpers/account-type-name-mapping.js'

export class AccountService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'account/info'
  }

  async fetchAccountInfo() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      config: { baseURL: '/api' }
    })
    return this._adaptAccountInfo(response.data)
  }

  async getAccountInfo(options = {}) {
    return await this.syncSensitiveQuery(['account', 'info'], () => this.fetchAccountInfo(), options)
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
