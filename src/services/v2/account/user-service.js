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
      return this.prefetchQuery(
        ['user', 'info'],
        () => this.fetchUserInfo(),
        { persistent: 'user.persistent', isUser: true }
      )
    }
    
    return this.useQuery(
      ['user', 'info'],
      () => this.fetchUserInfo(),
      { persistent: 'user.persistent', isUser: true, ...options }
    )
  }

  getCurrentUser() {
    return this.getUserInfo()
  }
}

export const userService = new UserService()
