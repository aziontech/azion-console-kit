import { BaseService } from '@/services/v2/base/query/baseService'
import { CacheSettingsAdapter } from './edge-app-cache-settings-adapter'
import { waitForPersistenceRestore } from '@/services/v2/base/query/queryPlugin'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class CacheSettingsService extends BaseService {
  constructor() {
    super()
    this.adapter = CacheSettingsAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/cache_settings${suffix}`
  }

  #fetchList = async (edgeApplicationId, params) => {
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

  listCacheSettingsService = async (edgeApplicationId, params = { pageSize: 100, page: 1 }) => {
    await waitForPersistenceRestore()

    const queryKey = queryKeys.edgeApp.cacheSettings.list(edgeApplicationId, params)
    const firstPage = params.page === 1
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(edgeApplicationId, params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  /**
   * Prefetches the first page of cache settings to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeApplicationId - The edge application ID
   */
  prefetchCacheSettingsList = async (edgeApplicationId) => {
    return await this.listCacheSettingsService(edgeApplicationId, {
      pageSize: 10,
      page: 1,
      fields: [],
      ordering: 'id'
    })
  }

  #fetchCacheSetting = async (edgeApplicationId, cacheSettingId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeApplicationId, `/${cacheSettingId}`)
    })

    return this.adapter?.transformLoadCacheSetting?.(data) ?? data.data
  }

  loadCacheSettingsService = async (edgeApplicationId, cacheSettingId) => {
    

    await waitForPersistenceRestore()

    return await this.useEnsureQueryData(
      queryKeys.edgeApp.cacheSettings.detail(edgeApplicationId, cacheSettingId),
      () => this.#fetchCacheSetting(edgeApplicationId, cacheSettingId),
      { persist: false }
    )
  }

  createCacheSettingsService = async (edgeApplicationId, payload) => {
    const body = this.adapter?.requestPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(edgeApplicationId),
      body
    })

    // Remove list queries from cache (including IndexedDB) after creating
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.cacheSettings.all(edgeApplicationId) })

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

    // Remove list and detail queries from cache (including IndexedDB) after editing
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.cacheSettings.all(edgeApplicationId) })

    return 'Cache Settings successfully edited'
  }

  deleteCacheSettingService = async (edgeApplicationId, cacheSettingId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeApplicationId, `/${cacheSettingId}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.cacheSettings.all(edgeApplicationId) })

    return 'Cache Setting successfully deleted'
  }
}

export const cacheSettingsService = new CacheSettingsService()
