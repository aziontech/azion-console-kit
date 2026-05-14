import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

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

export class DeploymentHistoryService extends BaseService {
  #baseURL = 'v4/deployments'

  #fetchGlobal = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/history`,
      params,
      config: { baseURL: '/api' }
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentVersionAdapter.transformList(results),
      count
    }
  }

  #fetchByDeployment = async (deploymentId, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${deploymentId}/history`,
      params,
      config: { baseURL: '/api' }
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentVersionAdapter.transformList(results),
      count
    }
  }

  listGlobalHistoryService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.history.global(params),
      () => this.#fetchGlobal(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  listDeploymentHistoryService = async (deploymentId, params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.history.byDeployment(deploymentId, params),
      () => this.#fetchByDeployment(deploymentId, params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  diffVersionsService = async (deploymentId, { from, to } = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${deploymentId}/versions/diff`,
      params: { from, to },
      config: { baseURL: '/api' }
    })

    return {
      data: DeploymentVersionAdapter.transformDiff(parseItemResponse(data))
    }
  }
}

export const deploymentHistoryService = new DeploymentHistoryService()
