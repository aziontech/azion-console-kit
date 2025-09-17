import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/BaseService'
import { EdgeFirewallFunctionAdapter } from './edge-firewall-function-adapter'

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

  listEdgeFirewallFunctionsService = async (edgeFirewallId, query = { pageSize: 10 }) => {
    const { body: functionInstances, count } = await this.listFunctionsService(
      edgeFirewallId,
      query
    )
    this.countFunctions = count

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

    return { feedback: 'Your Function has been created', id: data.data.id }
  }

  editEdgeFirewallFunctionService = async (payload) => {
    const body = this.#getTransformed('transformPayloadFunction', [payload, 'PATCH'])

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.edgeFirewallID, `/${payload.id}`),
      body
    })

    return 'Function successfully updated'
  }

  loadFunctionsService = async (edgeFirewallId, functionId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallFunction', data.data)
  }

  deleteEdgeFirewallFunctionService = async (functionId, edgeFirewallId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    return 'Function successfully deleted'
  }
}

export const edgeFirewallFunctionService = new EdgeFirewallFunctionService()
