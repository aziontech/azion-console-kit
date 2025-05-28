export class WafService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_firewall/wafs'
  }

  listWafRules = async (
    params = { search: '', fields: '', ordering: 'name', page: 1, pageSize: 10 }
  ) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    return this.adapter?.transformListWafRules?.(data) ?? data
  }

  createWafRule = async (payload) => {
    const adaptedPayload = this.adapter.adaptWafRulePayload({ payload })
    const { data: response } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: adaptedPayload
    })

    return {
      feedback: 'Your WAF Rule has been created',
      urlToEditView: `/waf/edit/${response.data.id}`
    }
  }

  editWafRule = async (payload, wafId) => {
    const adaptedPayload = this.adapter.adaptWafRulePayload({ payload, isEdit: true })
    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${wafId}`,
      body: adaptedPayload
    })

    return 'Your WAF rule has been updated.'
  }

  deleteWafRule = async (wafId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${wafId}`
    })

    return 'WAF Rule successfully deleted.'
  }

  loadWafRule = async ({ id }) => {
    const { data: response } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter?.transformLoadWafRule?.(response) ?? response
  }

  cloneWafRule = async ({ wafRulesName, payload }) => {
    const adaptedPayload = this.adapter.adaptCloneWafRulePayload(payload, wafRulesName)
    const { data: response } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body: adaptedPayload
    })

    return {
      feedback: 'Your WAF rule has been cloned',
      urlToEditView: `/waf/edit/${response.data.id}`
    }
  }
}
