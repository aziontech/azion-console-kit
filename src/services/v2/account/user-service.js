import { BaseService } from '../base'

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
    const { prefetch = false } = options
    
    if (prefetch) {
      return this.fetchUserQuery(
        ['user', 'info'],
        () => this.fetchUserInfo()
      )
    }
    
    return this.useUserQuery(
      ['user', 'info'],
      () => this.fetchUserInfo()
    )
  }

  getCurrentUser() {
    return this.getUserInfo()
  }
}

export const userService = new UserService()
