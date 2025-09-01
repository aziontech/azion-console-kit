export class EdgeDNSService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/workspace/dns/zones'
  }

  getUrl(suffix = '') {
    return `${this.baseURL}${suffix}`
  }

  listEdgeDNSService = async (params = { pageSize: 10, fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(),
      params
    })

    const { results, count } = data

    const transformed = this.adapter?.transformListEdgeDNS?.(results, params.fields)

    return {
      count,
      body: transformed
    }
  }

  loadEdgeDNSService = async ({ id, params = { fields: [] } }) => {
    const { data: response } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${id}`),
      params
    })

    return this.adapter?.transformLoadEdgeDNS?.(response.data, params.fields)
  }

  loadEdgeDNSZoneDNSSEC = async (DNSZoneID, params = { fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${DNSZoneID}/dnssec`)
    })

    return this.adapter?.transformLoadEdgeDNSSEC?.(data.data, params.fields)
  }

  createEdgeDNSZoneDNSSEC = async (DNSZoneID, enableDNSSEC = true) => {
    await this.http.request({
      method: 'PUT',
      url: this.getUrl(`/${DNSZoneID}/dnssec`),
      body: {
        enabled: enableDNSSEC
      }
    })
  }

  createEdgeDNSZonesService = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(),
      body: this.adapter?.transformPayload?.(payload)
    })

    if (payload.dnssec) this.createEdgeDNSZoneDNSSEC(data.data.id)

    return data
  }

  editEdgeDNSService = async (payload) => {
    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(`/${payload.id}`),
      body: this.adapter?.transformPayloadEdit?.(payload)
    })

    this.createEdgeDNSZoneDNSSEC(payload.id, payload.dnssec)

    return 'Edge DNS has been updated'
  }

  deleteEdgeDNSService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(`/${id}`)
    })

    return 'Your Edge DNS has been deleted'
  }
}
