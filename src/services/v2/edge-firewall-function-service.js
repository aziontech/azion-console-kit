export class EdgeFirewallFunctionService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/firewalls'
    this.functionListEndpoint = 'v4/edge_functions/functions'
    this.countFunctions = 0
  }

  getUrl(edgeFirewallId, suffix = '') {
    return `${this.baseURL}/${edgeFirewallId}/functions${suffix}`
  }

  async listFunctionsService(edgeFirewallId, params = { pageSize: 10 }) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeFirewallId),
      params
    })

    const parsedResults = this.adapter?.transformListFunction?.(data.results) ?? data.results

    return {
      count: data.count,
      body: parsedResults
    }
  }

  async listEdgeFirewallFunctionsService(edgeFirewallId, query = { pageSize: 10 }) {
    const { body: instances, count } = await this.listFunctionsService(edgeFirewallId, query)
    this.countFunctions = count

    const enrichedFunctions = await this.resolveNamesForFunctions(instances)

    return {
      body: enrichedFunctions,
      count
    }
  }

  async resolveNamesForFunctions(functionInstances) {
    let page = 1
    const pageSize = 100
    const unresolvedIds = new Set(functionInstances.map((functions) => functions.id))
    const enriched = []

    let functionNameMap = new Map()

    while (unresolvedIds.size > 0) {
      const { results } = await this.listFunctionNames(page, pageSize)
      if (!results?.length) break

      for (const func of results) {
        functionNameMap.set(func.id, func.name)
      }

      for (const instance of functionInstances) {
        if (unresolvedIds.has(instance.id) && functionNameMap.has(instance.edgeFunctionId)) {
          enriched.push({
            ...instance,
            functionInstanced: functionNameMap.get(instance.edgeFunctionId)
          })
          unresolvedIds.delete(instance.id)
        }
      }

      if (results.length < pageSize) break
      page++
    }

    return this.adapter?.transformFunction?.(enriched) ?? []
  }

  async listFunctionNames(params = { page: 1, pageSize: 100, fields: 'id,name' }) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.functionListEndpoint,
      params
    })

    return {
      results: data.results,
      count: data.count
    }
  }

  createEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformPayloadFunction?.(payload, 'POST') ?? payload

    await this.http.request({
      method: 'POST',
      url: this.getUrl(payload.id),
      body
    })

    return {
      feedback: 'Your Function has been created'
    }
  }

  editEdgeFirewallFunctionService = async (payload) => {
    const body = this.adapter?.transformPayloadFunction?.(payload, 'PATCH') ?? payload

    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(payload.edgeFirewallID, `/${payload.id}`),
      body
    })

    return 'Your Function has been updated'
  }

  async loadFunctionsService(edgeFirewallId, functionID) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(edgeFirewallId, `/${functionID}`)
    })

    return this.adapter?.transformLoadEdgeFirewallFunction?.(data) ?? data.data
  }

  deleteEdgeFirewallFunctionService = async (functionId, edgeFirewallID) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(edgeFirewallID, `/${functionId}`)
    })

    return 'Function successfully deleted'
  }
}
