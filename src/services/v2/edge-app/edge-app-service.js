import { EdgeAppAdapter } from './edge-app-adapter'
import { BaseService, createReactiveQueryKey } from '@/services/v2/base/query/baseService'
import { unref } from 'vue'
import { TABLE_FIRST_PAGE_OPTIONS, TABLE_PAGINATION_OPTIONS } from '@/services/v2/base/query/config'
import { useQuery } from '@tanstack/vue-query'

const CONSTANTS = {
  CACHE_KEY: 'edge-apps-list',
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_LIST_FIELDS: ['id', 'name', 'active', 'last_editor', 'last_modified', 'product_version'],
  DEFAULT_DROPDOWN_FIELDS: ['id', 'name'],
  MESSAGES: {
    CLONE_SUCCESS: 'Your Application has been cloned',
    UPDATE_SUCCESS: 'Your application has been updated',
    DELETE_SUCCESS: 'Resource successfully deleted'
  }
}

export class EdgeAppService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeAppAdapter
    this.baseURL = 'v4/workspace/applications'
  }

  async invalidateListCache() {
    await this.queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        const shouldRemove =
          queryKey &&
          Array.isArray(queryKey) &&
          queryKey[0] === this.cacheType.GLOBAL &&
          queryKey.some((key) => typeof key === 'string' && key.includes(CONSTANTS.CACHE_KEY))
        return shouldRemove
      }
    })
  }

  async invalidatePreviousLoadCache(currentId) {
    await this.queryClient.removeQueries({
      predicate: (query) => {
        const queryKey = query.queryKey
        if (!queryKey || !Array.isArray(queryKey)) return false

        const isLoadCache =
          queryKey[0] === this.cacheType.GLOBAL &&
          queryKey.includes(CONSTANTS.CACHE_KEY) &&
          queryKey.includes('load')

        if (!isLoadCache) return false

        const isCurrentId = queryKey.some(
          (key) => typeof key === 'string' && key === `id=${currentId}`
        )

        return !isCurrentId
      }
    })
  }

  async #fetchList(params) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    return data
  }

  listEdgeAppService = async (params = {}) => {
    const { count, results } = await this.#fetchList(params)
    const body = this.adapter?.transformListEdgeApp?.(results, params.fields) ?? results
    return { body, count }
  }

  listEdgeApplicationsService = (params) => {
    const keyParams = ['page', 'pageSize', 'ordering', 'search']
    const queryKey = createReactiveQueryKey([CONSTANTS.CACHE_KEY], params, keyParams)
    const cacheOptions = this.#getCacheOptions(params)

    return this.useQuery({
      key: queryKey,
      queryFn: () => {
        const paramValues = unref(params) || {}
        const finalParams = {
          pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
          fields: CONSTANTS.DEFAULT_LIST_FIELDS,
          ...paramValues
        }
        return this.listEdgeAppService(finalParams)
      },
      ...cacheOptions
    })
  }

  #getCacheOptions(params) {
    const paramValues = unref(params) || {}
    const isFirstPage = paramValues.page === 1 || !paramValues.page
    const hasSearch = paramValues.search?.trim()

    const baseOptions = isFirstPage ? TABLE_FIRST_PAGE_OPTIONS : TABLE_PAGINATION_OPTIONS

    if (hasSearch) {
      return {
        ...baseOptions,
        meta: { persist: false }
      }
    }

    return baseOptions
  }

  listEdgeApplicationsServiceDropdown = async (
    params = {
      pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
      fields: CONSTANTS.DEFAULT_DROPDOWN_FIELDS
    }
  ) => {
    const { count, results } = await this.#fetchList(params)
    const body = this.adapter?.transformListDropdownEdgeApp?.(results) ?? results
    return { body, count }
  }

  useLoadEdgeApplication(edgeApplicationId, params = {}, options = {}) {
    return useQuery(
      {
        queryKey: [
          this.cacheType.GLOBAL,
          CONSTANTS.CACHE_KEY,
          'load',
          `id=${unref(edgeApplicationId)}`,
          params
        ],
        queryFn: async () => {
          const id = unref(edgeApplicationId)

          await this.invalidatePreviousLoadCache(id)

          const { data } = await this.http.request({
            method: 'GET',
            url: `${this.baseURL}/${id}`,
            params
          })

          return this.adapter?.transformLoadEdgeApp?.(data) ?? data.data
        },
        staleTime: this.cacheTime.TEN_MINUTES,
        gcTime: this.cacheTime.THIRTY_MINUTES,
        enabled: !!unref(edgeApplicationId),
        meta: {
          persist: true
        },
        ...options
      },
      this.queryClient
    )
  }

  loadEdgeApplicationService = async ({ id, params }) => {
    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, 'load', `id=${id}`, params || {}],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: `${this.baseURL}/${id}`,
          params
        })

        return this.adapter?.transformLoadEdgeApp?.(data) ?? data.data
      },
      staleTime: this.cacheTime.TEN_MINUTES,
      gcTime: this.cacheTime.THIRTY_MINUTES
    })
  }

  createEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    await this.invalidateListCache()

    return data
  }

  editEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    await this.invalidateListCache()

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  deleteEdgeApplicationService = async (edgeApplicationId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${edgeApplicationId}`
    })

    await this.invalidateListCache()

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
  }

  cloneEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    await this.invalidateListCache()

    return {
      feedback: CONSTANTS.MESSAGES.CLONE_SUCCESS,
      urlToEditView: `/applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }
}

export const edgeAppService = new EdgeAppService()
