import { EdgeAppAdapter } from './edge-app-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const DEFAULT_FIELDS = [
  'id',
  'name',
  'last_editor',
  'last_modified',
  'product_version',
  'active'
]

export class EdgeAppService extends BaseService {
  adapter = EdgeAppAdapter
  baseURL = 'v4/workspace/applications'
  fieldsDefault = DEFAULT_FIELDS

  #fetchList = async (
    params = {
      pageSize: 10,
      fields: this.fieldsDefault
    }
  ) => {
    const { data } = await this.http.request({ method: 'GET', url: this.baseURL, params })
    const { count, results } = data
    const body = this.adapter?.transformListEdgeApp?.(results, params.fields) ?? results
    return { body, count }
  }

  #fetchDropdown = async (params = { pageSize: 10, fields: ['id', 'name'] }) => {
    const { data } = await this.http.request({ method: 'GET', url: this.baseURL, params })
    const { count, results } = data
    const body = this.adapter?.transformListDropdownEdgeApp?.(results) ?? results
    return { body, count }
  }

  #fetchOne = async ({ id, params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params
    })
    return this.adapter?.transformLoadEdgeApp?.(data) ?? data.data
  }

  prefetchList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: this.fieldsDefault,
      ordering: '-last_modified'
    }

    const firstPage = params?.page === 1
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKeys.edgeApp.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  create = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    const { data } = await this.http.request({ method: 'POST', url: this.baseURL, body })
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })
    return data
  }

  clone = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })
    return {
      feedback: 'Your Application has been cloned',
      urlToEditView: `/applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }

  edit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({ method: 'PATCH', url: `${this.baseURL}/${payload.id}`, body })
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })
    return 'Your application has been updated'
  }

  delete = async (id) => {
    await this.http.request({ method: 'DELETE', url: `${this.baseURL}/${id}` })
    this.queryClient.removeQueries({ queryKey: queryKeys.edgeApp.all })
    return 'Resource successfully deleted'
  }

  listEdgeApplicationsService = async (params) => {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    const firstPage = params?.page === 1
    const queryKey = queryKeys.edgeApp.list(params)

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  listEdgeApplicationsServiceDropdown = this.#fetchDropdown

  loadEdgeApplicationService = async (payload) => {
    const queryKey = queryKeys.edgeApp.detail(payload.id)
    return await this.useEnsureQueryData(queryKey, () => this.#fetchOne(payload), {
      persist: false
    })
  }

  createEdgeApplicationService = this.create

  cloneEdgeApplicationService = this.clone

  editEdgeApplicationService = this.edit

  deleteEdgeApplicationService = this.delete
}

export const edgeAppService = new EdgeAppService()
