import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeDNSAdapter } from './edge-dns-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
export class EdgeDNSService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeDNSAdapter
    this.baseURL = 'v4/workspace/dns/zones'
  }

  getUrl(suffix = '') {
    return `${this.baseURL}${suffix}`
  }

  #fetchDNSList = async (params = { pageSize: 10, fields: [] }) => {
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

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.edgeDNS.list(defaultParams), () =>
      this.#fetchDNSList(defaultParams)
    )
  }

  getZoneFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.edgeDNS.all,
      id,
      listPath: 'body',
      select: (item) => ({
        ...item,
        name: item.name?.text ?? item.name,
        domain: item.domain?.content ?? item.domain,
        isActive: item.active?.content === 'Active',
        nameservers: item.nameservers,
        productVersion: item.productVersion
      })
    })
  }

  listEdgeDNSService = async (params = { pageSize: 10, fields: [] }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeDNS.list(params),
      () => this.#fetchDNSList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  loadEdgeDNSService = async ({ id, params = { fields: [] } }) => {
    const { data: response } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${id}`),
      params
    })

    return this.adapter?.transformLoadEdgeDNS?.(response.data, params.fields)
  }

  #fetchDNSSEC = async (DNSZoneID, params = { fields: [] }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.getUrl(`/${DNSZoneID}/dnssec`)
    })

    return this.adapter?.transformLoadEdgeDNSSEC?.(data.data, params.fields)
  }

  loadEdgeDNSZoneDNSSEC = async (DNSZoneID, params = { fields: [] }) => {
    return await this.useEnsureQueryData(
      queryKeys.edgeDNS.dnssec(DNSZoneID),
      () => this.#fetchDNSSEC(DNSZoneID, params),
      { persist: false }
    )
  }

  createEdgeDNSZoneDNSSEC = async (DNSZoneID, enableDNSSEC = true) => {
    await this.http.request({
      method: 'PUT',
      url: this.getUrl(`/${DNSZoneID}/dnssec`),
      body: {
        enabled: enableDNSSEC
      }
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeDNS.dnssec(DNSZoneID)
    })
  }

  createEdgeDNSZonesService = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(),
      body: this.adapter?.transformPayload?.(payload)
    })

    if (payload.dnssec) this.createEdgeDNSZoneDNSSEC(data.data.id)

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeDNS.all })

    return data
  }

  editEdgeDNSService = async (payload) => {
    await this.http.request({
      method: 'PATCH',
      url: this.getUrl(`/${payload.id}`),
      body: this.adapter?.transformPayloadEdit?.(payload)
    })

    this.createEdgeDNSZoneDNSSEC(payload.id, payload.dnssec)

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeDNS.all })

    return 'Edge DNS has been updated'
  }

  deleteEdgeDNSService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: this.getUrl(`/${id}`)
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.edgeDNS.all })

    return 'Your Edge DNS has been deleted'
  }
}

export const edgeDNSService = new EdgeDNSService()
