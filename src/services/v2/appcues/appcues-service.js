import { BaseService } from '@/services/v2/base/query/baseService'
import appcuesApi from '@/services/axios/makeAppcuesApi'

const ACCOUNT_ID = import.meta.env.VITE_APPCUES_ACCOUNT_ID

class AppcuesService extends BaseService {
  #api = null

  constructor() {
    super()
    this.#api = appcuesApi()
  }

  #getApi() {
    if (!this.#api) {
      this.#api = appcuesApi()
    }
    return this.#api
  }

  async fetchTags() {
    const api = this.#getApi()
    if (!api) return []

    return this.useEnsureQueryData(
      this.queryKeys.appcues.tags(),
      async () => {
        const response = await api.get(`/accounts/${ACCOUNT_ID}/tags`)
        return response.data || []
      },
      { cacheType: this.cacheType.STATIC }
    )
  }

  async fetchLaunchpads() {
    const api = this.#getApi()
    if (!api) return []

    return this.useEnsureQueryData(
      this.queryKeys.appcues.launchpads(),
      async () => {
        const response = await api.get(`/accounts/${ACCOUNT_ID}/launchpads`)
        return response.data || []
      },
      { cacheType: this.cacheType.STATIC }
    )
  }

  findTagIdByName(tags, tagName) {
    const tag = tags.find((item) => item.name === tagName)
    return tag?.id || null
  }

  filterLaunchpadsByTagId(launchpads, tagId) {
    return launchpads.filter((lp) => lp.tag_ids?.includes(tagId))
  }
}

export const appcuesService = new AppcuesService()
