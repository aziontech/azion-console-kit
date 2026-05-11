import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EnvironmentAdapter } from '@/services/v2/environment/environment-adapter'

const parseListResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length
    }
  }

  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
      ? data.data
      : []

  return {
    results,
    count: data?.count ?? results.length
  }
}

const parseItemResponse = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data) && data.data) {
    return data.data
  }

  return data
}

export class EnvironmentService extends BaseService {
  #baseURL = 'v4/environments'

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params,
      config: { baseURL: '/api' }
    })

    const { results, count } = parseListResponse(data)

    return {
      body: EnvironmentAdapter.transformList(results),
      count
    }
  }

  prefetchList = (params = {}) => {
    return this.usePrefetchQuery(queryKeys.environments.list(params), () => this.#fetchList(params))
  }

  listEnvironmentsService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.environments.list(params),
      () => this.#fetchList(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getEnvironmentFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.environments.all,
      id,
      listPath: 'body'
    })
  }

  getEnvironmentByIdService = async (id) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
    })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(data))
    }
  }

  createEnvironmentService = async (payload = {}) => {
    const body = EnvironmentAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(data))
    }
  }

  updateEnvironmentService = async (id, payload = {}) => {
    const body = EnvironmentAdapter.transformPatchPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteEnvironmentService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return { success: true }
  }
}

export const environmentService = new EnvironmentService()
