import { BaseService } from '@/services/v2/base/query/baseService'
import { MFAAdapter } from './mfa-adapter'
export class MFAService extends BaseService {
  constructor() {
    super()
    this.adapter = MFAAdapter
    this.baseURL = 'v4/auth/mfa/totp'
    this.iamEndpoint = 'v4/iam/users'
  }

  listMfaService = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data

    const body = this.adapter?.transformListMfa?.(results) ?? results

    return {
      count,
      body
    }
  }

  deleteMfaService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'MFA successfully deleted'
  }
}

export const mfaService = new MFAService()
