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

  createWafRuleAllowed = async ({ payload, id }) => {
    const adaptedPayload = this.adapter.adaptCreateWafRuleAllowedPayload(payload)
    await this.http.request({
      url: `${this.baseURL}/${id}/exceptions`,
      method: 'POST',
      body: adaptedPayload
    })

    return {
      feedback: 'Your waf rule allowed has been created'
    }
  }

  async _createTuningRequest({ wafId, payload }) {
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions`,
      method: 'POST',
      body: payload
    })

    return { feedback: 'Your waf rule allowed has been created' }
  }

  createWafRulesAllowedTuning = async ({ attackEvents, wafId, name }) => {
    const requests = attackEvents.flatMap((attack) => {
      const hasMatchValue = !!attack.matchValue

      if (!attack?.top10Paths) {
        const payload = this.adapter.adaptCreateWafRuleAllowedTuningPayload(
          attack,
          hasMatchValue,
          name
        )
        return [this._createTuningRequest({ wafId, payload })]
      }

      return attack.top10Paths.map(({ path }) => {
        const payload = this.adapter.adaptCreateWafRuleAllowedTuningPayload(
          attack,
          hasMatchValue,
          name,
          path
        )
        return this._createTuningRequest({ wafId, payload })
      })
    })

    return Promise.allSettled(requests)
  }

  deleteWafRuleAllowed = async ({ wafId, allowedId }) => {
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions/${allowedId}`,
      method: 'DELETE'
    })

    return 'WAF allowed rule successfully deleted'
  }

  editWafRuleAllowed = async ({ payload, wafId, allowedId }) => {
    const adaptedPayload = this.adapter.adaptCreateWafRuleAllowedPayload(payload)
    await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions/${allowedId}`,
      method: 'PUT',
      body: adaptedPayload
    })

    return 'Your waf rule allowed has been updated'
  }

  listWafRulesAllowed = async ({
    wafId,
    fields = '',
    search = '',
    ordering = '',
    page = 1,
    pageSize = 10
  }) => {
    const params = { fields, ordering, page, pageSize, search }
    const { data } = await this.http.request({
      url: `${this.baseURL}/${wafId}/exceptions`,
      method: 'GET',
      params
    })

    return this.adapter?.transformListWafRulesAllowed?.(data) ?? data
  }

  loadWafRuleAllowed = async ({ id, allowedId }) => {
    const { data } = await this.http.request({
      url: `${this.baseURL}/${id}/exceptions/${allowedId.id}`,
      method: 'GET'
    })

    return this.adapter?.transformLoadWafRuleAllowed?.(data) ?? data
  }
}
