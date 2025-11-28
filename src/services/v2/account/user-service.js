import { BaseService } from '@/services/v2/base/query/baseService'

export const userKeys = { all: ['user'], info: () => [...userKeys.all, 'info'] }

export class UserService extends BaseService {
  baseUrl = 'user/me'

  async fetchUserInfo() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseUrl,
      config: { baseURL: '/api' }
    })
    return response.data
  }

  async getUserInfo() {
    const queryKey = userKeys.info()
    return await this._ensureQueryData(queryKey, async () => this.fetchUserInfo(), {
      cacheType: this.cacheType.SENSITIVE
    })
  }
}

export const userService = new UserService()
