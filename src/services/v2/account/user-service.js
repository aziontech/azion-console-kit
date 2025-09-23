import { BaseService } from '../base/BaseService'

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

  async getUserInfo(options = {}) {
    return await this.syncSensitiveQuery(['user', 'info'], () => this.fetchUserInfo(), options)
  }

  getCurrentUser() {
    return this.getUserInfo()
  }
}

export const userService = new UserService()
