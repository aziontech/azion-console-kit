export class CacheSettingsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/cache_settings${suffix}`
  }

  listCacheSettingsService = async (edgeApplicationId, params = { pageSize: 100 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId),
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListCacheSetting?.(results) ?? results

    return {
      count,
      body: transformed
    }
  }

  loadCacheSettingsService = async (edgeApplicationId, cacheSettingId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, `/${cacheSettingId}`)
    })

    return this.adapter?.transformLoadCacheSetting?.(data) ?? data.data
  }

  createCacheSettingsService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.requestPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body
    })

    return {
      feedback: 'Cache Settings successfully created',
      cacheId: data.data.id
    }
  }

  editCacheSettingsService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.requestPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PUT',
      url: this.getUrl(edgeApplicationId, `/${payload.id}`),
      body
    })

    return 'Cache Settings successfully edited'
  }

  deleteCacheSettingService = async (edgeApplicationId, cacheSettingId) => {
    const { data } = await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${cacheSettingId}`)
    })

    return data.results
  }
}
