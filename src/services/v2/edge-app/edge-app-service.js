import { EdgeAppAdapter } from './edge-app-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'


export class EdgeAppService extends BaseService {
  adapter = EdgeAppAdapter
  baseURL = 'v4/workspace/applications'

  #fetchList = async (
    params = {
      pageSize: 10,
    }
  ) => {
    const { data } = await this.http.request({ method: 'GET', url: this.baseURL, params })
    const { count, results } = data
    const body = this.adapter?.transformListEdgeApp?.(results) ?? results
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

  prefetchList = (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      ordering: '-last_modified'
    }
    return this.usePrefetchQuery(queryKeys.application.list(params), () => this.#fetchList(params))
  }

  create = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    const { data } = await this.http.request({ method: 'POST', url: this.baseURL, body })
    this.queryClient.removeQueries({ queryKey: queryKeys.application.all })
    return data
  }

  clone = async (payload) => {
    const body = this.adapter?.transformPayloadClone?.(payload) ?? payload
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/${payload.id}/clone`,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.application.all })
    return {
      feedback: 'Your Application has been cloned',
      urlToEditView: `/applications/edit/${data.data.id}`,
      applicationId: data.data.id
    }
  }

  edit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({ method: 'PATCH', url: `${this.baseURL}/${payload.id}`, body })
    this.queryClient.removeQueries({ queryKey: queryKeys.application.all })
    return 'Your application has been updated'
  }

  delete = async (id) => {
    await this.http.request({ method: 'DELETE', url: `${this.baseURL}/${id}` })
    this.queryClient.removeQueries({ queryKey: queryKeys.application.all })
    return 'Resource successfully deleted'
  }

  listEdgeApplicationsService = async (params) => {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    const firstPage = params?.page === 1
    const queryKey = queryKeys.application.list(params)

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  listEdgeApplicationsServiceDropdown = this.#fetchDropdown

  loadEdgeApplicationService = async (payload) => {
    const queryKey = queryKeys.application.detail(payload.id)
    return await this.useEnsureQueryData(queryKey, () => this.#fetchOne(payload), {
      persist: false
    })
  }

  createEdgeApplicationService = this.create

  cloneEdgeApplicationService = this.clone

  editEdgeApplicationService = this.edit

  deleteEdgeApplicationService = this.delete

  getApplicationFromCache = (id) => {
    if (!id) return undefined
  
    return super.getFromCache({
      queryKey: queryKeys.application.all,
      id,
      listPath: 'body',
      select: (item) => ({  
        ...item,
        name: item.name.text,
        isActive: item.active?.content === 'Active'
      }),
    })
  }
}

export const edgeAppService = new EdgeAppService()
