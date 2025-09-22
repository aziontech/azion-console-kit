import { BaseService } from '../base'
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

  getAccountInfo(options = {}) {
    const { prefetch = false } = options
    
    if (prefetch) {
      return this.prefetchQuery(
        ['account', 'info'],
        () => this.fetchAccountInfo(),
        { persistent: 'user.persistent', isUser: true }
      )
    }
    
    return this.useQuery(
      ['account', 'info'],
      () => this.fetchAccountInfo(),
      { persistent: 'user.persistent', isUser: true, ...options }
    )
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
