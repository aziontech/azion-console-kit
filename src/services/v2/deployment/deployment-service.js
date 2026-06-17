import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'

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

const buildApiListParams = (params = {}) => {
  const page = Number(params.page) > 0 ? Number(params.page) : 1

  const rawPageSize = params.pageSize ?? params.page_size
  const pageSize = Number(rawPageSize) > 0 ? Math.min(Number(rawPageSize), 100) : 20

  const nameFilter =
    typeof params.name === 'string' && params.name.trim().length > 0
      ? params.name.trim()
      : typeof params.search === 'string' && params.search.trim().length > 0
        ? params.search.trim()
        : undefined

  return {
    page,
    page_size: pageSize,
    ...(nameFilter ? { name: nameFilter } : {})
  }
}

export class DeploymentService extends BaseService {
  #baseURL = '/deployment-api/v1/deployments'

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: buildApiListParams(params)
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentAdapter.transformList(results),
      count
    }
  }

  prefetchList = (params = {}) => {
    return this.usePrefetchQuery(queryKeys.deployments.list(params), () => this.#fetchList(params))
  }

  listDeploymentsService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.list(params),
      () => this.#fetchList(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getDeploymentFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.deployments.all,
      id,
      listPath: 'body'
    })
  }

  getDeploymentByIdService = async (id) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  createDeploymentService = async (payload = {}) => {
    const body = DeploymentAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  updateDeploymentService = async (id, payload = {}) => {
    const body = DeploymentAdapter.transformPatchPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteDeploymentService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return { success: true }
  }
}

export const deploymentService = new DeploymentService()
