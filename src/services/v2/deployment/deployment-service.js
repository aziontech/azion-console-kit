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

export class DeploymentService extends BaseService {
  #baseURL = 'v4/deployments'

  #fetchList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params,
      config: { baseURL: '/api' }
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
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
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
      body,
      config: { baseURL: '/api' }
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
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteDeploymentService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`,
      config: { baseURL: '/api' }
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return { success: true }
  }
}

export const deploymentService = new DeploymentService()
