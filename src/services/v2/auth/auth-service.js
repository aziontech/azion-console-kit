import { BaseService } from '@/services/v2/base/query/baseService'
import { AuthAdapter } from './auth-adapter'

export class AuthService extends BaseService {
  constructor() {
    super()
    this.adapter = AuthAdapter
    this.baseURL = 'v4/account/auth/login'
  }

  verifyLoginMethodService = async (email) => {
    const emailEncoded = encodeURIComponent(email)

    const result = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/method?email=${emailEncoded}`
    })

    return this.adapter.transformLoginMethod(result.data)
  }

  loginService = async (payload) => {
    const body = this.adapter.transformPayloadLogin(payload)
    const result = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}`,
      body
    })

    return this.adapter.transformLoginMethod(result.data)
  }
}

export const authService = new AuthService()
