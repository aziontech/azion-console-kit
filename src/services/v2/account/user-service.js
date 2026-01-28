import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

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
    const queryKey = queryKeys.user.info()
    return await this.useEnsureQueryData(queryKey, async () => this.fetchUserInfo())
  }
}

export const userService = new UserService()
