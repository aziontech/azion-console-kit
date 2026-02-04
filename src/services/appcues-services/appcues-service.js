import { BaseService } from '@/services/v2/base/query/baseService'
import appcuesApi from '../axios/makeAppcuesApi'

const ACCOUNT_ID = import.meta.env.VITE_APPCUES_ACCOUNT_ID

class AppcuesService extends BaseService {
  #api = null

  #getApi() {
    if (!this.#api) {
      this.#api = appcuesApi()
    }
    return this.#api
  }

  async getTags() {
    const api = this.#getApi()
    if (!api || !ACCOUNT_ID) {
      return []
    }

    return await this.useEnsureQueryData(
      this.queryKeys.appcues.tags(),
      async () => {
        const response = await api.get(`/accounts/${ACCOUNT_ID}/tags`)
        return response.data || []
      },
      { cacheType: this.cacheType.STATIC }
    )
  }

  async getLaunchpads() {
    const api = this.#getApi()
    if (!api || !ACCOUNT_ID) {
      return []
    }

    return await this.useEnsureQueryData(
      this.queryKeys.appcues.launchpads(),
      async () => {
        const response = await api.get(`/accounts/${ACCOUNT_ID}/launchpads`)
        return response.data || []
      },
      { cacheType: this.cacheType.STATIC }
    )
  }
}

export const appcuesService = new AppcuesService()
