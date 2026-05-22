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
  #baseURL = '/deployment-api/v1/deployments'

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
      url: `${this.#baseURL}/${deploymentId}/versions`,
      params
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}`
    })

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  createVersionService = async (deploymentId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${deploymentId}/versions`,
      body
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/cancel`,
      body
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/archive`,
      body
    })

    this.#invalidateVersions(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteVersionService = async (deploymentId, versionId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}`
    })

    this.#invalidateVersions(deploymentId)

    return { success: true }
  }

  activateVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformActivatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/activate`,
      body
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/rollback`,
      body
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/promote`,
      body
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
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/strategy`,
      body
    })

    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.versions.detail(deploymentId, versionId)
    })
    this.#invalidateVersions(deploymentId)

    return {
      data: parseItemResponse(data)
    }
  }

  editDraftVersionService = async (deploymentId, versionId, payload = {}) => {
    const body = DeploymentVersionAdapter.transformEditDraftPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}`,
      body
    })

    this.#invalidateVersions(deploymentId)

    return {
      data: DeploymentVersionAdapter.transformItem(parseItemResponse(data))
    }
  }

  deployDraftVersionService = async (deploymentId, versionId) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${deploymentId}/versions/${versionId}/deploy`
    })

    this.#invalidateVersions(deploymentId)
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: parseItemResponse(data)
    }
  }
}

export const deploymentVersionService = new DeploymentVersionService()
