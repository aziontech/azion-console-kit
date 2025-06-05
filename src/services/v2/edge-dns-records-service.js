export class EdgeDNSRecordsService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/edge_dns/zones'
  }

  getUrl(suffix = '') {
    return `${this.baseURL}${suffix}`
  }

  listRecords = async (zoneId, params = { pageSize: 10, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${zoneId}/records`),
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListRecords?.(results, params.fields)

    return {
      count,
      body: transformed
    }
  }

  loadRecord = async ({ id, edgeDNSId }, params = { fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${edgeDNSId}/records/${id}`),
      ...params
    })

    return this.adapter?.transformLoadRecord?.(data, params.fields)
  }

  createRecord = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(`/${payload.edgeDNSID}/records`),
      body: this.adapter?.transformPayload?.(payload)
    })

    return {
      feedback: 'Edge DNS Record has been created',
      urlToEditView: `/edge-dns/edit/${payload.edgeDNSID}/records/edit/${data.data.id}`
    }
  }

  deleteRecord = async ({ recordID, edgeDNSID }) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(`/${edgeDNSID}/records/${recordID}`)
    })

    return 'Edge DNS Record successfully deleted'
  }

  editRecordsService = async (payload) => {
    await this.http.request({
      method: 'PUT',
      url: this.getUrl(`/${payload.edgeDNSId}/records/${payload.id}`),
      body: this.adapter?.transformPayloadEdit?.(payload)
    })

    return 'Edge DNS Record has been updated'
  }
}
