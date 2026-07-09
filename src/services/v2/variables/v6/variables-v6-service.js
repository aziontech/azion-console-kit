import { VariablesV6Adapter } from '@/services/v2/variables/v6/variables-v6-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class VariablesV6Service extends BaseService {
  #baseURL = '/variables-api/api/variables'

  #toPaginated = (data, transform) => {
    const results = Array.isArray(data) ? data : (data?.results ?? [])
    const count = Array.isArray(data) ? data.length : (data?.count ?? results.length)
    return { count, body: transform(results) }
  }

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params
    })
    return this.#toPaginated(data, VariablesV6Adapter.transformList)
  }

  #fetchVersions = async (id, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/versions`,
      params
    })
    return this.#toPaginated(data, VariablesV6Adapter.transformVersionsList)
  }

  list = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.variablesV6.list(params),
      () => this.#fetchList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  load = async ({ id }) => {
    return await this.useEnsureQueryData(queryKeys.variablesV6.detail(id), async () => {
      const { data } = await this.http.request({
        method: 'GET',
        url: `${this.#baseURL}/${id}`
      })
      return VariablesV6Adapter.transformFormItem(data)
    })
  }

  create = async (payload) => {
    const body = VariablesV6Adapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.variablesV6.all })

    const variable = VariablesV6Adapter.transformItem(data)

    return {
      id: variable.id,
      key: variable.key,
      value: variable.value?.content ?? variable.value,
      secret: variable.value?.isSecret ?? false,
      scope: variable.scope
    }
  }

  edit = async ({ id, values, initialValues }) => {
    const body = VariablesV6Adapter.transformPatchPayload(values, initialValues)

    if (Object.keys(body).length === 0) {
      return 'Your variable has been updated'
    }

    await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.variablesV6.all })

    return 'Variable updated - a new version is now current'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.variablesV6.all })

    return 'Variable successfully deleted'
  }

  listVersions = async ({ id, ...params }) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.variablesV6.versions.list(id, params),
      () => this.#fetchVersions(id, params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  rollback = async ({ id, versionId }) => {
    const body = VariablesV6Adapter.transformRollbackPayload()

    await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/rollback/${versionId}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.variablesV6.all })

    return 'Variable successfully rolled back'
  }
}

export const variablesV6Service = new VariablesV6Service()
