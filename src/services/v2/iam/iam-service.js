import { BaseService } from '@/services/v2/base/BaseService'
import { IAMAdapter } from './iam-adapter'
export class IAMService extends BaseService {
  constructor() {
    super()
    this.adapter = IAMAdapter
    this.baseURL = 'v4/iam/identity_providers/social'
    this._socialIdpsCache = null
  }

  listSocialIdps = async () => {
    if (this._socialIdpsCache) {
      return this._socialIdpsCache
    }

    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      body: {}
    })

    this._socialIdpsCache = this.adapter?.transformListSocialIdps?.(data)

    return this._socialIdpsCache
  }
}

export const iamService = new IAMService()
