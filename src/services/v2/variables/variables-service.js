import { VariablesAdapter } from './variables-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const DEFAULT_FIELDS = ['id', 'key', 'value', 'lastEditor', 'lastModified', 'lastModify']

export class VariablesService extends BaseService {
  adapter = VariablesAdapter
  baseURL = 'v3/variables'
  fieldsDefault = DEFAULT_FIELDS

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })
    const results = Array.isArray(data) ? data : data?.results ?? []
    const count = Array.isArray(data) ? data.length : data?.count ?? results.length
    const body = this.adapter?.transformList?.(results, params.fields) ?? results
    return { body, count }
  }

  #fetchOne = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })
    return this.adapter?.transformOne?.(data) ?? data
  }

  prefetchList = async (pageSize = 10) => {
    const params = {
      page: 1,
      pageSize,
      fields: this.fieldsDefault
    }

    const firstPage = params?.page === 1
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(
      queryKeys.variables.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  create = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: payload
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })
    return { ...data, secret: payload.secret }
  }

  edit = async (payload) => {
    const body = this.adapter?.transformPayload?.(payload) ?? payload
    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })
    return 'Your variable has been updated'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })
    return 'Variable successfully deleted'
  }

  listVariablesService = async (params = {}) => {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search
    const firstPage = params?.page === 1 || !params?.page
    const queryKey = queryKeys.variables.list(params)

    return await this.useEnsureQueryData(queryKey, () => this.#fetchList(params), {
      persist: firstPage && !skipCache,
      skipCache
    })
  }

  loadVariableService = async (payload) => {
    const queryKey = queryKeys.variables.detail(payload.id)
    const data = await this.useEnsureQueryData(queryKey, () => this.#fetchOne(payload), {
      persist: false
    })
    return { body: data }
  }

  createVariablesService = this.create

  editVariableService = this.edit

  deleteVariablesService = this.delete
}

export const variablesService = new VariablesService()
