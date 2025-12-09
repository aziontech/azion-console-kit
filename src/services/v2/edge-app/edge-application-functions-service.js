import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeApplicationFunctionsAdapter } from './edge-application-functions-adapter'

export const edgeAppFunctionsKeys = {
  all: (edgeAppId) => {
    if (!edgeAppId) {
      // eslint-disable-next-line no-console
      console.warn('[edgeAppFunctionsKeys] Invalid edgeAppId provided:', edgeAppId)
      return ['edge-app-functions', '__invalid_edge_app_id__']
    }
    return ['edge-app-functions', edgeAppId]
  },
  lists: (edgeAppId) => [...edgeAppFunctionsKeys.all(edgeAppId), 'list'],
  details: (edgeAppId) => [...edgeAppFunctionsKeys.all(edgeAppId), 'detail'],
  detail: (edgeAppId, functionId) => {
    if (functionId === null || functionId === undefined) {
      // eslint-disable-next-line no-console
      console.warn('[edgeAppFunctionsKeys] Invalid functionId provided:', functionId)
      return [...edgeAppFunctionsKeys.details(edgeAppId), '__invalid_function_id__']
    }
    return [...edgeAppFunctionsKeys.details(edgeAppId), functionId]
  }
}

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
    const queryKey = [...edgeAppFunctionsKeys.lists(edgeApplicationId), params]
    const hasFilter = params?.hasFilter || false

    return await this._ensureQueryData(
      () => queryKey,
      () => this.#fetchEdgeApplicationFunctions(edgeApplicationId, params),
      { persist: params.page === 1 && !params.search && !hasFilter, skipCache: hasFilter }
    )
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
    const cachedQueries = this.queryClient.getQueriesData({
      queryKey: edgeAppFunctionsKeys.details(edgeApplicationID)
    })

    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== functionID
    })

    if (hasDifferentId) {
      await this.queryClient.removeQueries({
        queryKey: edgeAppFunctionsKeys.details(edgeApplicationID)
      })
    }

    return await this._ensureQueryData(
      () => edgeAppFunctionsKeys.detail(edgeApplicationID, functionID),
      () => this.#fetchEdgeApplicationFunction({ edgeApplicationID, functionID }),
      { persist: true }
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
    this.queryClient.removeQueries({ queryKey: edgeAppFunctionsKeys.all(edgeApplicationId) })

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
    this.queryClient.removeQueries({
      queryKey: edgeAppFunctionsKeys.all(payload.edgeApplicationID)
    })
    this.queryClient.removeQueries({
      queryKey: edgeAppFunctionsKeys.details(payload.edgeApplicationID)
    })

    return 'Your Function has been updated'
  }

  deleteEdgeApplicationFunction = async (functionID, edgeApplicationID) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    // Remove list queries from cache (including IndexedDB) after deleting
    this.queryClient.removeQueries({ queryKey: edgeAppFunctionsKeys.all(edgeApplicationID) })

    return 'Your Function successfully deleted'
  }
}

export const edgeApplicationFunctionService = new EdgeApplicationFunctionService()
