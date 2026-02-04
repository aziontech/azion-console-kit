import { VariablesAdapter } from '@/services/v2/variables/variables-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class VariablesService extends BaseService {
  #baseURL = 'v3/variables'

  #fetchList = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      config: { baseURL: '/api' }
    })
    const results = Array.isArray(data) ? data : (data?.results ?? [])
    const count = Array.isArray(data) ? data.length : (data?.count ?? results.length)
    const body = VariablesAdapter.transformList(results)
    return { body, count }
  }

  prefetchList = () => {
    return this.usePrefetchQuery(queryKeys.variables.list(), () => this.#fetchList())
  }

  list = async (params = {}) => {
    const skipCache = params?.hasFilter || params?.skipCache || params?.search

    return await this.useEnsureQueryData(queryKeys.variables.list(), () => this.#fetchList(), {
      persist: !skipCache,
      skipCache
    })
  }

  getFromCache = (id) => {
    if (!id) return undefined

    const listData = this.queryClient.getQueryData(queryKeys.variables.list())

    if (!listData?.body) {
      return undefined
    }

    const variable = listData.body.find((item) => String(item.id) === String(id))

    if (!variable) {
      return undefined
    }

    return {
      id: variable.id,
      key: variable.key,
      value: variable.value?.content ?? variable.value,
      secret: variable.value?.isSecret ?? false
    }
  }

  load = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
    })

    const variable = VariablesAdapter.transformItem(data)

    return {
      id: variable.id,
      key: variable.key,
      value: variable.value?.content ?? variable.value,
      secret: variable.value?.isSecret ?? false
    }
  }

  create = async (payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: payload,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })

    const variable = VariablesAdapter.transformItem(data)

    return {
      id: variable.id,
      key: variable.key,
      value: variable.value?.content ?? variable.value,
      secret: variable.value?.isSecret ?? false
    }
  }

  edit = async (payload) => {
    const body = VariablesAdapter.transformPayload(payload)
    await this.http.request({
      method: 'PUT',
      url: `${this.#baseURL}/${payload.id}`,
      body,
      config: { baseURL: '/api' }
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })
    return 'Your variable has been updated'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
    })
    this.queryClient.removeQueries({ queryKey: queryKeys.variables.all })
    return 'Variable successfully deleted'
  }
}

export const variablesService = new VariablesService()
