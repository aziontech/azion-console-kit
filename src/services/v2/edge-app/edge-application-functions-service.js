import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeApplicationFunctionsAdapter } from './edge-application-functions-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeApplicationFunctionService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeApplicationFunctionsAdapter
    this.baseURL = 'v4/workspace/applications'
    this.functionListEndpoint = 'v4/workspace/functions'
  }

  #getUrl(edgeApplicationId, suffix = '') {
    return `${this.baseURL}/${edgeApplicationId}/functions${suffix}`
  }

  listFunctions = async (edgeApplicationId, params = { pageSize: 10, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationId),
      params
    })

    const { results, count } = data
    const body = this.adapter?.transformListFunctions?.(results, params?.fields) ?? results

    return {
      body,
      count
    }
  }

  listFunctionsDropdown = async (edgeApplicationId, params = { pageSize: 10, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationId),
      params
    })

    const { results, count } = data
    const body = this.adapter?.transformListFunctionsDropdown?.(results) ?? results

    return {
      body,
      count
    }
  }

  #fetchEdgeApplicationFunctions = async (edgeApplicationId, params) => {
    params.fields = ['id', 'name', 'last_editor', 'last_modified', 'function']
    const { body: functionInstances, count } = await this.listFunctions(edgeApplicationId, params)
    if (!count) return []

    const enrichedFunctions = await enrichByMatchingReference({
      items: functionInstances,
      fetchReferencePage: this.#listFunctionNames,
      getReferenceId: (item) => item.function,
      merge: (item, matchedRef) => ({
        ...item,
        functionInstanced: matchedRef.name
      }),
      pageSize: 100
    })

    return {
      count: count,
      body: enrichedFunctions
    }
  }

  listEdgeApplicationFunctions = async (
    edgeApplicationId,
    params = { pageSize: 10, fields: [], page: 1 }
  ) => {
    const queryKey = queryKeys.edgeApp.functionInstance.list(edgeApplicationId, params)
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    return await this.useEnsureQueryData(
      queryKey,
      () => this.#fetchEdgeApplicationFunctions(edgeApplicationId, params),
      { persist: false, skipCache }
    )
  }

  /**
   * Prefetches the first page of functions instances to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeApplicationId - The edge application ID
   */
  prefetchFunctionsList = async (edgeApplicationId) => {
    return await this.listEdgeApplicationFunctions(edgeApplicationId, {
      pageSize: 10,
      page: 1,
      ordering: 'name',
      fields: ['id', 'name', 'edge_function', 'args', 'last_modified', 'last_editor']
    })
  }

  #listFunctionNames = async (params = { page: 1, pageSize: 100, fields: 'id,name' }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.functionListEndpoint,
      params
    })

    return { results: data.results, count: data.count }
  }

  #fetchEdgeApplicationFunction = async ({ edgeApplicationID, functionID }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    return this.adapter?.transformLoadEdgeApplicationFunction(data) ?? data
  }

  loadEdgeApplicationFunction = async ({ edgeApplicationID, functionID }) => {
    return await this.useEnsureQueryData(
      queryKeys.edgeApp.functionInstance.detail(edgeApplicationID, functionID),
      () => this.#fetchEdgeApplicationFunction({ edgeApplicationID, functionID }),
      { persist: false }
    )
  }

  createEdgeApplicationFunction = async (payload) => {
    const edgeApplicationId = payload.id
    const body = this.adapter?.transformPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeApplicationId),
      body
    })

    // Remove list queries from cache (including IndexedDB) after creating
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })

    return {
      feedback: 'Your Function has been created',
      id: data.data.id
    }
  }

  editEdgeApplicationFunction = async (payload) => {
    const body = this.adapter?.transformEditPayload(payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.edgeApplicationID, `/${payload.id}`),
      body
    })

    // Remove list and detail queries from cache (including IndexedDB) after editing
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })

    return 'Your Function has been updated'
  }

  deleteEdgeApplicationFunction = async (functionID, edgeApplicationID) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })

    return 'Your Function successfully deleted'
  }
}

export const edgeApplicationFunctionService = new EdgeApplicationFunctionService()
