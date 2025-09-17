import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/BaseService'
import { DataStreamAdapter } from './data-stream-adapter'

export class DataStreamService extends BaseService {
  constructor() {
    super()
    this.adapter = DataStreamAdapter
    this.baseURL = 'v4/data_stream/streams'
    this.dataSetsEndpoint = 'v4/data_stream/templates'
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

    const getTemplateId = (item) =>
      item.transform?.find((transform) => transform.type === 'render_template')?.attributes
        ?.template

    const enriched = await enrichByMatchingReference({
      items: data.results,
      fetchReferencePage: this.listTemplates,
      getReferenceId: getTemplateId,
      merge: (item, matchedRef) => ({
        ...item,
        templateName: matchedRef.name
      }),
      pageSize: 100
    })

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

  createDataStreamService = async (payload) => {
    const body = this.#getTransformed('transformPayloadDataStream', payload)

    const response = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return response.data
  }

  createTemplateService = async (payload) => {
    const body = this.#getTransformed('transformPayloadTemplate', payload)

    const response = await this.http.request({
      method: 'POST',
      url: this.dataSetsEndpoint,
      body
    })

    return {
      feedback: 'Your custom template has been created',
      id: response.data.data.id
    }
  }

  editTemplateService = async (payload) => {
    const body = this.#getTransformed('transformPayloadTemplate', payload)

    const result = await this.http.request({
      method: 'PATCH',
      url: `${this.dataSetsEndpoint}/${payload.id}`,
      body
    })
    return {
      feedback: 'Your custom template has been updated',
      id: result.data.data.id
    }
  }

  deleteTemplateService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.dataSetsEndpoint}/${id}`
    })

    return 'Template successfully deleted'
  }

  loadTemplateService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.dataSetsEndpoint}/${id}`
    })

    return this.#getTransformed('transformLoadTemplate', data.data)
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
    const filterWorkloads = data.data.transform?.find((item) => item.type === 'filter_workloads')

    const workloads = filterWorkloads
      ? await this.handlesWorkloads(filterWorkloads.attributes?.workloads)
      : await this.handlesWorkloads([])

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

export const dataStreamService = new DataStreamService()
