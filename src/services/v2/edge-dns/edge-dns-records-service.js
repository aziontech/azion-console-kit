import { BaseService } from '@/services/v2/base/query/baseService'
import { EdgeDNSRecordsAdapter } from './edge-dns-records-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
export class EdgeDNSRecordsService extends BaseService {
  constructor() {
    super()
    this.adapter = EdgeDNSRecordsAdapter
    this.baseURL = 'v4/workspace/dns/zones'
  }

  getUrl(suffix = '') {
    return `${this.baseURL}${suffix}`
  }

  #fetchRecordsList = async (zoneId, params = { pageSize: 10, fields: [] }) => {
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

  prefetchRecordsList = async (zoneId, pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      fields: [],
      ordering: 'id'
    }
    return await this.useEnsureQueryData(
      queryKeys.edgeDNS.records.list(zoneId, defaultParams),
      () => this.#fetchRecordsList(zoneId, defaultParams),
      { persist: false }
    )
  }

  listRecords = async (zoneId, params = { pageSize: 10, fields: [] }) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeDNS.records.list(zoneId, params),
      () => this.#fetchRecordsList(zoneId, params),
      { persist: false, skipCache }
    )
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

    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeDNS.records.all(payload.edgeDNSID)
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

    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeDNS.records.all(edgeDNSID)
    })

    return 'Edge DNS Record successfully deleted'
  }

  editRecordsService = async (payload) => {
    await this.http.request({
      method: 'PUT',
      url: this.getUrl(`/${payload.edgeDNSId}/records/${payload.id}`),
      body: this.adapter?.transformPayload?.(payload)
    })

    this.queryClient.removeQueries({
      queryKey: queryKeys.edgeDNS.records.all(payload.edgeDNSId)
    })

    return 'Edge DNS Record has been updated'
  }
}

export const edgeDNSRecordsService = new EdgeDNSRecordsService()
