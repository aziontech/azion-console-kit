import { EdgeAppAdapter } from './edge-app-adapter'
import { BaseService, createReactiveQueryKey } from '@/services/v2/base/query/baseService'
import { useMutation } from '@tanstack/vue-query'
import { unref } from 'vue'

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

    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      await this.queryClient.prefetchQuery({
        queryKey: [
          this.cacheType.GLOBAL,
          CONSTANTS.CACHE_KEY,
          'page=1',
          `pageSize=${CONSTANTS.DEFAULT_PAGE_SIZE}`,
          'ordering=-last_modified'
        ],
        queryFn: () =>
          this.listEdgeAppService({
            page: 1,
            pageSize: CONSTANTS.DEFAULT_PAGE_SIZE,
            fields: CONSTANTS.DEFAULT_LIST_FIELDS,
            ordering: '-last_modified'
          }),
        staleTime: this.cacheTime.THIRTY_MINUTES
      })
    } catch (error) {
      // Failed to prefetch page 1
    }
  }

  // ==================== Private Helper Methods ====================

  async #fetchList(params) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    return data
  }

  #createMutationWithCacheInvalidation(mutationFn, options = {}) {
    return useMutation(
      {
        mutationFn,
        onSuccess: async (data, variables, context) => {
          await this.invalidateListCache()

          if (options.onSuccess) {
            await options.onSuccess(data, variables, context)
          }
        },
        ...options
      },
      this.queryClient
    )
  }

  // ==================== List Methods ====================

  listEdgeAppService = async (params = {}) => {
    const { count, results } = await this.#fetchList(params)
    const body = this.adapter?.transformListEdgeApp?.(results, params.fields) ?? results
    return { body, count }
  }

  listEdgeApplicationsService = (params) => {
    const keyParams = ['page', 'pageSize', 'ordering', 'search']
    const queryKey = createReactiveQueryKey([CONSTANTS.CACHE_KEY], params, keyParams)

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
      overrides: {
        staleTime: this.cacheTime.THIRTY_MINUTES,
        gcTime: this.cacheTime.ONE_DAY,
        refetchOnMount: true
      }
    })
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

  // ==================== Load Method ====================

  loadEdgeApplicationService = async ({ id, params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params
    })

    return this.adapter?.transformLoadEdgeApp?.(data) ?? data.data
  }

  // ==================== Create Methods ====================

  useCreateEdgeApplication(options = {}) {
    return this.#createMutationWithCacheInvalidation(
      (payload) => this.createEdgeApplicationService(payload),
      options
    )
  }

  createEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return data
  }

  createEdgeApplicationServiceWithInvalidation = async (payload) => {
    const result = await this.createEdgeApplicationService(payload)
    await this.invalidateListCache()
    return result
  }

  // ==================== Edit Methods ====================

  useEditEdgeApplication(options = {}) {
    return this.#createMutationWithCacheInvalidation(
      (payload) => this.editEdgeApplicationService(payload),
      options
    )
  }

  editEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  editEdgeApplicationServiceWithInvalidation = async (payload) => {
    const result = await this.editEdgeApplicationService(payload)
    await this.invalidateListCache()
    return result
  }

  // ==================== Delete Methods ====================

  useDeleteEdgeApplication(options = {}) {
    return this.#createMutationWithCacheInvalidation(
      (edgeApplicationId) => this.deleteEdgeApplicationService(edgeApplicationId),
      options
    )
  }

  deleteEdgeApplicationService = async (edgeApplicationId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${edgeApplicationId}`
    })

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
  }

  deleteEdgeApplicationServiceWithInvalidation = async (edgeApplicationId) => {
    const result = await this.deleteEdgeApplicationService(edgeApplicationId)
    await this.invalidateListCache()
    return result
  }

  // ==================== Clone Methods ====================

  useCloneEdgeApplication(options = {}) {
    return this.#createMutationWithCacheInvalidation(
      (payload) => this.cloneEdgeApplicationService(payload),
      options
    )
  }

  cloneEdgeApplicationService = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })

    return {
      feedback: CONSTANTS.MESSAGES.CLONE_SUCCESS,
      urlToEditView: `/applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }

  cloneEdgeApplicationServiceWithInvalidation = async (payload) => {
    const result = await this.cloneEdgeApplicationService(payload)
    await this.invalidateListCache()
    return result
  }
}

export const edgeAppService = new EdgeAppService()
