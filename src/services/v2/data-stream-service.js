import { enrichByMatchingReference } from './utils/enrichByMatchingReference'

export class DataStreamService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/data_stream/streams'
    this.dataSetsEndpoint = 'v4/data_stream/data_sets'
    this.workloadEndpoint = 'v4/workspace/workloads'
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  listDataStreamService = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const enriched = await enrichByMatchingReference(
      data.results,
      this.listTemplates,
      (item) => item.data_set_id,
      (item, matchedRef) => ({
        ...item,
        templateName: matchedRef.name
      }),
      { pageSize: 100 }
    )

    return {
      count: data.count,
      body: this.#getTransformed('transformListDataStream', enriched)
    }
  }

  listTemplates = async (params = { page: 1, pageSize: 100, fields: 'id,name' }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.dataSetsEndpoint,
      params
    })

    const results = this.#getTransformed('transformListTemplate', data.results)

    return { results, count: data.count }
  }

  createDataSteramService = async (payload) => {
    const body = this.#getTransformed('transformPayloadDataStream', payload)

    const response = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return response.data
  }

  editDataStreamService = async (payload) => {
    const body = this.#getTransformed('transformPayloadDataStream', payload)

    await this.http.request({
      method: 'PATCH',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Your data stream has been updated'
  }

  loadDataStreamService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    const workloads = await this.handlesWorkloads(data.data.filters.workloads)

    return this.#getTransformed('transformLoadDataStream', [data.data, workloads])
  }

  handlesWorkloads = async (workloadsIds) => {
    const pageSize = 100
    let page = 1
    let allWorkloads = []
    let fetchedAll = false

    const idsToFind = new Set(workloadsIds)
    const foundMap = new Map()

    while (!fetchedAll && foundMap.size < workloadsIds.length) {
      const response = await this.listWorkloadsService({
        page,
        pageSize: pageSize,
        fields: 'id, name'
      })
      const results = response.results

      allWorkloads = [...allWorkloads, ...results]

      results.forEach((workload) => {
        if (idsToFind.has(workload.id)) {
          foundMap.set(workload.id, workload)
        }
      })

      if (results.length < pageSize) {
        fetchedAll = true
      }

      page++
    }

    const found = Array.from(foundMap.values())

    const notFoundIds = allWorkloads.filter((workload) => !workloadsIds.includes(workload.id))

    return [notFoundIds, found]
  }

  listWorkloadsService = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.workloadEndpoint,
      params
    })

    return { results: data.results, count: data.count }
  }

  deleteDataStreamService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Data Stream successfully deleted'
  }
}
