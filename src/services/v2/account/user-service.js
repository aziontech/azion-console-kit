import { BaseService } from '@/services/v2/base/query/baseService'
import { CACHE_TYPE } from '@/services/v2/base/query/config'

export const userKeys = {
  all: ['user'],
  info: () => [...userKeys.all, 'info']
}

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

  async getUserInfo(options = {}) {
    const queryKey = userKeys.info()
    const queryFn = async () => {
      return this.fetchUserInfo()
    }
    const meta = {
      cacheType: CACHE_TYPE.SENSITIVE
    }
    return this._ensureQueryData(queryKey, queryFn, meta, options)
  }
}

export const userService = new UserService()
