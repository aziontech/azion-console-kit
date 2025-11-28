import { toValue } from 'vue'
import { EdgeAppAdapter } from './edge-app-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export const edgeAppKeys = {
  all: ['edge-apps'],
  lists: () => [...edgeAppKeys.all, 'list'],
  list: ({ page, pageSize, fields, search, ordering }) => [
    ...edgeAppKeys.lists(),
    page,
    pageSize,
    fields,
    search,
    ordering
  ],
  details: () => [...edgeAppKeys.all, 'detail'],
  detail: (id) => [...edgeAppKeys.details(), id]
}

export class EdgeAppService extends BaseService {
  adapter = EdgeAppAdapter
  baseURL = 'v4/workspace/applications'

  #fetchList = async (
    params = {
      pageSize: 10,
      fields: ['id', 'name', 'active', 'last_editor', 'last_modified', 'product_version']
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

  ensureList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: [
        'id',
        'name',
        'last_editor',
        'last_modified',
        'last_modify',
        'product_version',
        'active'
      ],
      ordering: '-last_modified'
    }

    await this._ensureQueryData(edgeAppKeys.list(params), () => this.#fetchList(params), {
      persist: true
    })
  }

  create = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    const { data } = await this.http.request({ method: 'POST', url: this.baseURL, body })
    this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.lists() })
    return data
  }

  clone = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })
    this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.lists() })
    return {
      feedback: 'Your Application has been cloned',
      urlToEditView: `/applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }

  edit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({ method: 'PATCH', url: `${this.baseURL}/${payload.id}`, body })
    this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.lists() })
    this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.details() })
    return 'Your application has been updated'
  }

  delete = async (id) => {
    await this.http.request({ method: 'DELETE', url: `${this.baseURL}/${id}` })
    this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.lists() })
    return 'Resource successfully deleted'
  }


  /** @deprecated Use listEdgeApplicationsService with useQuery */
  listEdgeApplicationsService = async (params) => {
    const paramsValue = toValue(params)
    return await this._ensureQueryData(
      () => edgeAppKeys.list(paramsValue),
      () => this.#fetchList(paramsValue),
      { persist: paramsValue?.page === 1 && !paramsValue?.search }
    )
  }

  /** @deprecated Use #fetchDropdown internally */
  listEdgeApplicationsServiceDropdown = this.#fetchDropdown

  /** @deprecated Use #fetchOne internally */
  loadEdgeApplicationService = async (params) => {
    const cachedQueries = this.queryClient.getQueriesData({ queryKey: edgeAppKeys.details() })
    
    const hasDifferentId = cachedQueries.some(([key]) => {
      const cachedId = key[key.length - 1]
      return cachedId && cachedId !== params.id
    })
    
    if (hasDifferentId) {
      await this.queryClient.invalidateQueries({ queryKey: edgeAppKeys.details() })
    }
    
    return await this._ensureQueryData(
      () => edgeAppKeys.detail(params.id),
      () => this.#fetchOne(params),
      { persist: true }
    )
  }

  /** @deprecated Use create() */
  createEdgeApplicationService = this.create

  /** @deprecated Use clone() */
  cloneEdgeApplicationService = this.clone

  /** @deprecated Use edit() */
  editEdgeApplicationService = this.edit

  /** @deprecated Use delete() */
  deleteEdgeApplicationService = this.delete
}

export const edgeAppService = new EdgeAppService()
