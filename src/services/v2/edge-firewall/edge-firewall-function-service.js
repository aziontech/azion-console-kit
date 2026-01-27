import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeFirewallFunctionAdapter } from './edge-firewall-function-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class EdgeFirewallFunctionService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeFirewallFunctionAdapter
    this.baseURL = 'v4/workspace/firewalls'
    this.functionListEndpoint = 'v4/workspace/functions'
    this.countFunctions = 0
  }

  #getUrl = (edgeFirewallId, suffix = '') => {
    return `${this.baseURL}/${edgeFirewallId}/functions${suffix}`
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  listFunctionsService = async (edgeFirewallId, params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId),
      params
    })
    const transformed = this.#getTransformed('transformListFunction', data.results)

    return {
      count: data.count,
      body: transformed
    }
  }

  listFunctionsDropdownService = async (edgeFirewallId, params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId),
      params
    })

    return {
      count: data.count,
      body: this.#getTransformed('transformListFunctionsDropdown', data.results)
    }
  }

  #fetchEdgeFirewallFunctions = async (edgeFirewallId, params) => {
    params.fields = ['id', 'name', 'last_editor', 'last_modified', 'function']
    const { body: functionInstances, count } = await this.listFunctionsService(
      edgeFirewallId,
      params
    )
    this.countFunctions = count
    if (!count) return []

    const enrichedFunctions = await enrichByMatchingReference({
      items: functionInstances,
      fetchReferencePage: this.#listFunctionNames,
      getReferenceId: (item) => item.edgeFunctionId,
      merge: (item, matchedRef) => ({
        ...item,
        functionInstanced: matchedRef.name
      }),
      pageSize: 100
    })

    return {
      body: this.#getTransformed('transformFunction', enrichedFunctions),
      count
    }
  }

  listEdgeFirewallFunctionsService = async (
    edgeFirewallId,
    params = { pageSize: 10, fields: [], page: 1 }
  ) => {
    const queryKey = queryKeys.firewall.functions.list(edgeFirewallId, params)
    const firstPage = params?.page === 1
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    return await this.useEnsureQueryData(
      queryKey,
      () => this.#fetchEdgeFirewallFunctions(edgeFirewallId, params),
      { persist: firstPage && !skipCache, skipCache }
    )
  }

  /**
   * Prefetches the first page of functions instances to warm up the cache.
   * Uses prefetch to avoid duplicate requests when the same query is called multiple times.
   * @param {string} edgeFirewallId - The edge firewall ID
   */
  prefetchFunctionsList = async (edgeFirewallId) => {
    return await this.listEdgeFirewallFunctionsService(edgeFirewallId, {
      pageSize: 10,
      page: 1,
      ordering: 'id'
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

  createEdgeFirewallService = async (payload) => {
    const body = this.#getTransformed('transformPayloadFunction', [payload, 'POST'])

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(payload.id),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return { feedback: 'Your Function has been created', id: data.data.id }
  }

  editEdgeFirewallFunctionService = async (payload) => {
    const body = this.#getTransformed('transformPayloadFunction', [payload, 'PATCH'])

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.edgeFirewallID, `/${payload.id}`),
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return 'Function successfully updated'
  }

  #fetchEdgeFirewallFunction = async ({ edgeFirewallId, functionId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallFunction', data.data)
  }

  loadFunctionsService = async (edgeFirewallId, functionId) => {
    return await this.useEnsureQueryData(
      queryKeys.firewall.functions.detail(edgeFirewallId, functionId),
      () => this.#fetchEdgeFirewallFunction({ edgeFirewallId, functionId }),
      { persist: false }
    )
  }

  deleteEdgeFirewallFunctionService = async (functionId, edgeFirewallId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.firewall.all })

    return 'Function successfully deleted'
  }
}

export const edgeFirewallFunctionService = new EdgeFirewallFunctionService()
