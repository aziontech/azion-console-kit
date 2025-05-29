export class EdgeFirewallService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/firewalls'
  }

  #getUrl(suffix = '') {
    return suffix ? `${this.baseURL}/${suffix}` : this.baseURL
  }

  #getTransformed(method, data, fallback) {
    return this.adapter?.[method]?.(data) ?? fallback
  }

  async listEdgeFirewallService(params = { pageSize: 10 }) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const transformed = await Promise.all(
      this.#getTransformed('transformListEdgeFirewall', data.results, data.results)
    )

    return {
      count: data.count,
      body: transformed
    }
  }

  async createEdgeFirewallService(payload) {
    const body = this.#getTransformed('transformPayload', payload, payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    const id = data?.data?.id

    return {
      feedback: 'Your Edge Firewall has been created',
      urlToEditView: `/edge-firewall/edit/${id}`,
      id
    }
  }

  async cloneEdgeFirewallService(name, id) {
    const body = { name, id }

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(`${id}/clone`),
      body
    })

    const clonedId = data?.data?.id

    return {
      feedback: 'Your Edge Firewall has been cloned',
      urlToEditView: `/edge-firewall/edit/${clonedId}`,
      id: clonedId
    }
  }

  async editEdgeFirewallService(payload) {
    const body = this.#getTransformed('requestPayload', payload, payload)

    await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(payload.id),
      body
    })

    return { feedback: 'Your Edge Firewall has been updated' }
  }

  async loadEdgeFirewallService({ id }) {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(id)
    })

    return this.#getTransformed('transformLoadEdgeFirewall', data, data.data)
  }

  async deleteEdgeFirewallService(id) {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(id)
    })

    return { feedback: 'Edge Firewall successfully deleted' }
  }
}
