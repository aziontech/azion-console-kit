export class EdgeFirewallFunctionService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/firewalls'
    this.functionListEndpoint = 'v4/edge_functions/functions'
    this.countFunctions = 0
  }

  #getUrl = (edgeFirewallId, suffix = '') => {
    return `${this.baseURL}/${edgeFirewallId}/functions${suffix}`
  }

  #getTransformed = (method, data, fallback) => {
    return this.adapter?.[method]?.(data) ?? fallback
  }

  listFunctionsService = async (edgeFirewallId, params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId),
      params
    })

    return {
      count: data.count,
      body: this.#getTransformed('transformListFunction', data.results, data.results)
    }
  }

  listEdgeFirewallFunctionsService = async (edgeFirewallId, query = { pageSize: 10 }) => {
    const { body: functionInstances, count } = await this.listFunctionsService(
      edgeFirewallId,
      query
    )
    this.countFunctions = count

    const enrichedFunctions = await this.#enrichFunctionsWithNames(functionInstances)

    return {
      body: this.#getTransformed('transformFunction', enrichedFunctions, enrichedFunctions),
      count
    }
  }

  #enrichFunctionsWithNames = async (functionInstances) => {
    const unresolvedIds = new Set(functionInstances.map((fn) => fn.id))
    const enriched = []
    const nameMap = new Map()

    let page = 1
    const pageSize = 100

    while (unresolvedIds.size > 0) {
      const { results } = await this.#listFunctionNames({ page, pageSize, fields: 'id,name' })
      if (!results?.length) break

      results.forEach((fn) => nameMap.set(fn.id, fn.name))

      for (const instance of functionInstances) {
        if (unresolvedIds.has(instance.id) && nameMap.has(instance.edgeFunctionId)) {
          enriched.push({
            ...instance,
            functionInstanced: nameMap.get(instance.edgeFunctionId)
          })
          unresolvedIds.delete(instance.id)
        }
      }

      if (results.length < pageSize) break
      page++
    }

    return enriched
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
    const body = this.#getTransformed('transformPayloadFunction', [payload, 'POST'], payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(payload.id),
      body
    })

    return { feedback: 'Function successfully created' }
  }

  editEdgeFirewallFunctionService = async (payload) => {
    const body = this.#getTransformed('transformPayloadFunction', [payload, 'PATCH'], payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.edgeFirewallID, `/${payload.id}`),
      body
    })

    return { feedback: 'Function successfully updated' }
  }

  loadFunctionsService = async (edgeFirewallId, functionId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallFunction', data, data.data)
  }

  deleteEdgeFirewallFunctionService = async (functionId, edgeFirewallId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${functionId}`)
    })

    return { feedback: 'Function successfully deleted' }
  }
}
