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
  // This is a temporary baseURL for the new deployment api, to be ajusted after the migration is complete
  #baseURL = '/deployment-api/v1/environments'

  #fetchList = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL
    })

    const { results, count } = parseListResponse(data)

    return {
      body: EnvironmentAdapter.transformList(results),
      count
    }
  }

  #fetchDropdown = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL
    })

    const { results, count } = parseListResponse(data)

    const body = results.map((env) => ({
      id: env.id,
      name: env.name,
      value: env.id,
      deployment_version_policy: env.deployment_version_policy
    }))

    return { body, count }
  }

  listEnvironmentsServiceDropdown = this.#fetchDropdown

  loadEnvironmentService = async ({ id }) => {
    const { data: raw } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })

    const data = parseItemResponse(raw)

    return {
      id: data.id,
      name: data.name,
      value: data.id,
      deployment_version_policy: data.deployment_version_policy
    }
  }

  prefetchList = () => {
    return this.usePrefetchQuery(queryKeys.environments.list(), () => this.#fetchList())
  }

  listEnvironmentsService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(queryKeys.environments.list(), () => this.#fetchList(), {
      persist: !skipCache,
      skipCache
    })
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
    const { data: raw } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  createEnvironmentService = async (payload = {}) => {
    const body = EnvironmentAdapter.transformCreatePayload(payload)

    const { data: raw } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  updateEnvironmentService = async (id, payload = {}) => {
    const body = EnvironmentAdapter.transformPatchPayload(payload)

    const { data: raw } = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  deleteEnvironmentService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return { success: true }
  }
}

export const environmentService = new EnvironmentService()
