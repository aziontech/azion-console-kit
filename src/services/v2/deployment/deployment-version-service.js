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

export class DeploymentVersionService extends BaseService {
  #getUrl(deploymentId, suffix = '') {
    return `v4/deployments/${deploymentId}/versions${suffix}`
  }

  #invalidateVersions = (deploymentId) => {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.versions.all(deploymentId)
    })
  }

  #invalidateDeploymentDetail = (deploymentId) => {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.detail(deploymentId)
    })
  }

  #fetchList = async (deploymentId, params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(deploymentId),
      params,
      config: { baseURL: '/api' }
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentVersionAdapter.transformList(results),
      count
    }
  }

  listVersionsService = async (deploymentId, params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.versions.list(deploymentId, params),
      () => this.#fetchList(deploymentId, params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getVersionByIdService = async (deploymentId, versionId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#getUrl(deploymentId, `/${versionId}`),
      config: { baseURL: '/api' }
    })

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  createVersionService = async (deploymentId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId),
      body,
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  cancelVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformCancelPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId, `/${versionId}/cancel`),
      body,
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  archiveVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformArchivePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId, `/${versionId}/archive`),
      body,
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteVersionService = async (deploymentId, versionId) => {
    await this.http.request({
      method: 'DELETE',
      url: this.#getUrl(deploymentId, `/${versionId}`),
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)

    return { success: true }
  }

  activateVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformActivatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId, `/${versionId}/activate`),
      body,
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  rollbackVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformRollbackPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId, `/${versionId}/rollback`),
      body,
      config: { baseURL: '/api' }
    })

    this.#invalidateVersions(deploymentId)
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  promoteVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformPromotePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#getUrl(deploymentId, `/${versionId}/promote`),
      body,
      config: { baseURL: '/api' }
    })

    if (body.target_deployment_id) {
      this.#invalidateVersions(body.target_deployment_id)
    }

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  patchVersionStrategyService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformStrategyPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: this.#getUrl(deploymentId, `/${versionId}/strategy`),
      body,
      config: { baseURL: '/api' }
    })

    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.versions.detail(deploymentId, versionId)
    })
    this.#invalidateVersions(deploymentId)

    return {
      data: parseItemResponse(data)
    }
  }
}

export const deploymentVersionService = new DeploymentVersionService()
