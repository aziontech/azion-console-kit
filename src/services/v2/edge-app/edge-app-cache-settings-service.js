import { BaseService } from '@/services/v2/base/query/baseService'
import { CacheSettingsAdapter } from './edge-app-cache-settings-adapter'

const CONSTANTS = {
  CACHE_KEY: 'cache-settings-list',
  DEFAULT_PAGE_SIZE: 100,
  MESSAGES: {
    CREATE_SUCCESS: 'Cache Settings successfully created',
    UPDATE_SUCCESS: 'Cache Settings successfully edited',
    DELETE_SUCCESS: 'Cache Settings successfully deleted'
  }
}

export class CacheSettingsService extends BaseService {
  constructor() {
    super()
    this.adapter = CacheSettingsAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/cache_settings${suffix}`
  }

  async invalidateListCache(edgeApplicationId) {
    await this.queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        return (
          queryKey &&
          Array.isArray(queryKey) &&
          queryKey[0] === this.cacheType.GLOBAL &&
          queryKey.includes(CONSTANTS.CACHE_KEY) &&
          queryKey.includes(`edgeAppId=${edgeApplicationId}`)
        )
      }
    })
  }

  listCacheSettingsService = async (edgeApplicationId, params = { pageSize: 100 }) => {
    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, `edgeAppId=${edgeApplicationId}`, params],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
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
      },
      staleTime: this.cacheTime.TEN_MINUTES,
      gcTime: this.cacheTime.THIRTY_MINUTES
    })
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

    await this.invalidateListCache(edgeApplicationId)

    return {
      feedback: CONSTANTS.MESSAGES.CREATE_SUCCESS,
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

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  deleteCacheSettingService = async (edgeApplicationId, cacheSettingId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${cacheSettingId}`)
    })

    await this.invalidateListCache(edgeApplicationId)

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
  }
}

export const cacheSettingsService = new CacheSettingsService()
