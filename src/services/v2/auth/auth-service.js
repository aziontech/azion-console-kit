import { BaseService } from '@/services/v2/base/query/baseService'

export class AuthService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'token'
  }

  verifyAuthenticationService = async () => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/verify`,
      config: { baseURL: '/api' }
    })
    return data
  }

  refreshAuthenticationService = async () => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/refresh`,
      config: { baseURL: '/api' }
    })
    return data
  }
  verifyEmailLoginMethod = async (email) => {
    const emailEncoded = encodeURIComponent(email)
    const { data } = await this.http.request({
      method: 'GET',
      url: `auth/login_method?email=${emailEncoded}`,
      config: { baseURL: '/api' }
    })
    return data
  }
}

export const authService = new AuthService()
