export class EdgeFirewallRulesEngineService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/firewalls'
  }

  #getUrl = (edgeFirewallId, suffix = '') => {
    return `${this.baseURL}/${edgeFirewallId}/request_rules${suffix}`
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  listEdgeFirewallRulesEngineService = async ({ id, fields = '', search = '' }) => {
    const allData = []
    let page = 1
    let totalCount = 0

    do {
      const { data } = await this.http.request({
        method: 'GET',
        url: this.#getUrl(id),
        params: {
          fields,
          ordering: '',
          page,
          pageSize: 100,
          search
        }
      })

      allData.push(...data.results)
      totalCount = data.count
      page++
    } while (allData.length < totalCount)

    const body = this.#getTransformed('transformListEdgeFirewallRulesEngine', allData)

    return { body, count: totalCount }
  }

  createEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'POST',
      url: this.#getUrl(edgeFirewallId),
      body
    })

    return { feedback: 'Rule Engine successfully created' }
  }

  editEdgeFirewallRulesEngineService = async (edgeFirewallId, payload) => {
    const body = this.#getTransformed('transformPayloadRulesEngine', payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(edgeFirewallId, `/${payload.id}`),
      body
    })

    return 'Rule Engine successfully updated'
  }

  loadEdgeFirewallRulesEngineService = async ({ id, edgeFirewallId }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(edgeFirewallId, `/${id}`)
    })

    return this.#getTransformed('transformLoadEdgeFirewallRulesEngine', data.data)
  }

  reorderEdgeFirewallRulesEngineService = async (payload, edgeFirewallId) => {
    const body = this.#getTransformed('transformReorderEdgeFirewallRulesEngine', payload)

    await this.http.request({
      method: 'PUT',
      url: this.#getUrl(edgeFirewallId, '/order'),
      body
    })

    return 'Rules Engine successfully ordered'
  }

  deleteEdgeFirewallRulesEngineService = async (edgeFirewallId, ruleEngineId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(edgeFirewallId, `/${ruleEngineId}`)
    })

    return 'Rules Engine successfully deleted'
  }
}
