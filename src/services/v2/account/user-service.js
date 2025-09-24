import { BaseService } from '@/services/v2/base/query/baseService'

export class UserService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'user/me'
  }

  async fetchUserInfo() {
    const response = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      config: { baseURL: '/api' }
    })
    return response.data
  }

  getUserInfo(options = {}) {
    return this.queryAsync({
      key: ['user', 'info'],
      queryFn: () => this.fetchUserInfo(),
      cache: this.cacheType.SENSITIVE,
      overrides: { refetchInterval: this.cacheTime.ONE_MINUTE, ...options }
    })
  }

  getCurrentUser() {
    return this.getUserInfo()
  }
}

export const userService = new UserService()
