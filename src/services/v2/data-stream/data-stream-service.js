import { enrichByMatchingReference } from '../utils/enrichByMatchingReference'
import { BaseService } from '@/services/v2/base/query/baseService'
import { DataStreamAdapter } from './data-stream-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DataStreamService extends BaseService {
  constructor() {
    super()
    this.adapter = DataStreamAdapter
    this.baseURL = 'v4/workspace/stream/streams'
    this.dataSetsEndpoint = 'v4/workspace/stream/templates'
    this.workloadEndpoint = 'v4/workspace/workloads'
    this.dataSources = 'v4/workspace/stream/data_sources'
  }

  #getTransformed = (method, data) => {
    return this.adapter?.[method]?.(data) ?? data
  }

  #fetchDataStreamList = async (params = { pageSize: 10 }) => {
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

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      page: 1,
      pageSize,
      ordering: '-last_modified',
      fields: [
        'id',
        'name',
        'active',
        'outputs',
        'transform',
        'inputs',
        'last_editor',
        'last_modified'
      ]
    }
    return this.usePrefetchQuery(queryKeys.dataStream.list(defaultParams), () =>
      this.#fetchDataStreamList(defaultParams)
    )
  }

  listDataStreamService = async (params = { pageSize: 10 }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.dataStream.list(params),
      () => this.#fetchDataStreamList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  listDataSourcesService = async (params = { pageSize: 10 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.dataSources,
      params
    })

    return {
      count: data.count,
      body: this.#getTransformed('transformListDataSources', data.results)
    }
  }

  getDataStreamFromCache = (id) => {
    if (!id) return undefined

    const queries = this.queryClient.getQueryCache().findAll({
      predicate: (query) => {
        const key = query.queryKey
        if (!Array.isArray(key)) return false
        return key[0] === 'data-streams'
      }
    })

    const firstQuery = queries[0]
    const body = firstQuery?.state?.data?.body
    const foundItem = body?.find((item) => String(item?.id) === String(id))

    return foundItem ?? undefined
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

    this.queryClient.removeQueries({ queryKey: queryKeys.dataStream.all })

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

    this.queryClient.removeQueries({ queryKey: queryKeys.dataStream.all })

    return 'Your data stream has been updated'
  }

  loadDataStreamService = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })
    const filterWorkloads = data.data.transform?.find((item) => item.type === 'filter_workloads')
    const templateTransform = data.data.transform?.find((item) => item.type === 'render_template')
    const templateId = templateTransform?.attributes?.template

    const [workloads, templateData] = await Promise.all([
      filterWorkloads
        ? this.handlesWorkloads(filterWorkloads.attributes?.workloads)
        : this.handlesWorkloads([]),
      templateId ? this.loadTemplateService({ id: templateId }) : null
    ])

    return this.#getTransformed('transformLoadDataStream', [data.data, workloads, templateData])
  }

  handlesWorkloads = async (workloadsIds) => {
    const pageSize = 100
    let page = 1
    let fetchedAll = false
    const allWorkloads = []

    const selectedIds = new Set(workloadsIds || [])

    while (!fetchedAll) {
      const response = await this.listWorkloadsService({
        page,
        pageSize: pageSize,
        fields: 'id, name'
      })
      const results = response.results

      allWorkloads.push(...results)

      if (results.length < pageSize) {
        fetchedAll = true
      }

      page++
    }

    const availableWorkloads = allWorkloads.filter((workload) => !selectedIds.has(workload.id))
    const selectedWorkloads = allWorkloads.filter((workload) => selectedIds.has(workload.id))

    return [availableWorkloads, selectedWorkloads]
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

    this.queryClient.removeQueries({ queryKey: queryKeys.dataStream.all })

    return 'Data Stream successfully deleted'
  }
}

export const dataStreamService = new DataStreamService()
