export class EdgeFirewallService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/firewalls'
  }

  listEdgeFirewallService = async (
    params = {
      pageSize: 10,
      fields: ['id', 'name', 'debug_rules', 'last_editor', 'last_modified', 'active']
    }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const { results, count } = data

    const parsedEdgeFirewalls = await Promise.all(
      this.adapter?.transformListEdgeFirewall?.(results, params.fields) ?? results
    )

    return {
      count,
      body: parsedEdgeFirewalls
    }
  }

  createEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return data
  }

  cloneEdgeFirewallService = async (name, id) => {
    const body = { name, id }

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${id}/clone`,
      body
    })

    return {
      feedback: 'Your Edge Firewall has been cloned',
      urlToEditView: `/edge-firewall/edit/${data.data.id}`,
      id: data.data.id
    }
  }

  editEdgeFirewallService = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Your edge firewall has been updated'
  }

  loadEdgeFirewallService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadEdgeFirewall?.(data) ?? data.data
  }

  deleteEdgeFirewallService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Edge Firewall successfully deleted'
  }
}
