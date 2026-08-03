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

const SELECTION_PAGE_SIZE = 100

const buildApiListParams = (params = {}) => {
  const hasPagination = params.page != null || params.pageSize != null || params.page_size != null

  const requestParams = {}

  if (hasPagination) {
    requestParams.page = Number(params.page) > 0 ? Number(params.page) : 1
    const rawPageSize = params.pageSize ?? params.page_size
    const pageSize = Number(rawPageSize) > 0 ? Math.min(Number(rawPageSize), 100) : 10
    requestParams.page_size = pageSize
  } else {
    requestParams.page_size = SELECTION_PAGE_SIZE
  }

  const nameFilter =
    typeof params.name === 'string' && params.name.trim().length > 0
      ? params.name.trim()
      : typeof params.search === 'string' && params.search.trim().length > 0
        ? params.search.trim()
        : undefined

  if (nameFilter) {
    requestParams.name = nameFilter
  }

  return requestParams
}

export class EnvironmentService extends BaseService {
  #baseURL = '/environment-api/v4/environments'

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: buildApiListParams(params)
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
      url: this.#baseURL,
      params: { page_size: SELECTION_PAGE_SIZE }
    })

    const { results, count } = parseListResponse(data)

    const body = results.map((env) => ({
      id: env.id,
      name: env.name,
      value: env.id,
      deployment_policy: env.deployment_policy
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
      deployment_policy: data.deployment_policy
    }
  }

  prefetchList = () => {
    return this.usePrefetchQuery(queryKeys.environments.list(), () => this.#fetchList())
  }

  useEnvironmentsListQuery = ({ enabled } = {}) =>
    this.useQuery(queryKeys.environments.list(), () => this.#fetchList(), {
      persist: false,
      enabled
    })

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
