import { BaseService } from '@/services/v2/base/query/baseService'

export class AuthService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'token'
  }

  verifyAuthenticationService = async () => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/verify`
    })
    return data
  }

  refreshAuthenticationService = async () => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/refresh`
    })
    return data
  }
}

export const authService = new AuthService()
