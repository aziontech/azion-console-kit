import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeApplicationFunctionsAdapter } from './edge-application-functions-adapter'

const CONSTANTS = {
  CACHE_KEY: 'edge-app-functions-list',
  DEFAULT_PAGE_SIZE: 10,
  MESSAGES: {
    CREATE_SUCCESS: 'Your Function has been created',
    UPDATE_SUCCESS: 'Your Function has been updated',
    DELETE_SUCCESS: 'Your Function successfully deleted'
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

  listEdgeApplicationFunctions = async (
    edgeApplicationId,
    params = { pageSize: 10, fields: [] }
  ) => {
    return this.queryAsync({
      key: [CONSTANTS.CACHE_KEY, `edgeAppId=${edgeApplicationId}`, params],
      cache: this.cacheType.GLOBAL,
      queryFn: async () => {
        params.fields = ['id', 'name', 'last_editor', 'last_modified', 'function']
        const { body: functionInstances, count } = await this.listFunctions(
          edgeApplicationId,
          params
        )
        if (!count) return { count: 0, body: [] }

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
      },
      staleTime: this.cacheTime.TEN_MINUTES,
      gcTime: this.cacheTime.THIRTY_MINUTES
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

  loadEdgeApplicationFunction = async ({ edgeApplicationID, functionID }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    return this.adapter?.transformLoadEdgeApplicationFunction(data) ?? data
  }

  createEdgeApplicationFunction = async (payload) => {
    const edgeApplicationId = payload.id
    const body = this.adapter?.transformPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeApplicationId),
      body
    })

    await this.invalidateListCache(edgeApplicationId)

    return {
      feedback: CONSTANTS.MESSAGES.CREATE_SUCCESS,
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

    await this.invalidateListCache(payload.edgeApplicationID)

    return CONSTANTS.MESSAGES.UPDATE_SUCCESS
  }

  deleteEdgeApplicationFunction = async (functionID, edgeApplicationID) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeApplicationID, `/${functionID}`)
    })

    await this.invalidateListCache(edgeApplicationID)

    return CONSTANTS.MESSAGES.DELETE_SUCCESS
  }
}

export const edgeApplicationFunctionService = new EdgeApplicationFunctionService()
