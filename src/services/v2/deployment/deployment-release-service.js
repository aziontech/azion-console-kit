import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentReleaseAdapter } from '@/services/v2/deployment/deployment-release-adapter'

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

  const state =
    typeof params.state === 'string' && params.state.trim().length > 0
      ? params.state.trim()
      : undefined

  return {
    page,
    page_size: pageSize,
    ...(state ? { state } : {})
  }
}

const ACTIVE_TRAFFIC_ROLE = 'ACTIVE'

const parseReleaseList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  return []
}

/**
 * One-shot release dispatch (`build_and_activate`) + active-release read, plus
 * the full releases CRUD (list/create/build/activate/promote/rollback/...).
 * `build_and_activate` invalidates both the drawer's active-release cache and
 * the releases/deployments caches; API errors (404/422) propagate untouched so
 * the drawer can surface them without losing form state.
 */
export class DeploymentReleaseService extends BaseService {
  #baseURL = '/deployment-api/v4/deployments'

  #releasesURL = (deploymentId) => `${this.#baseURL}/${deploymentId}/releases`

  #invalidateReleases = (deploymentId) => {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.releases.all(deploymentId)
    })
  }

  #invalidateDeployments = () => {
    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.all
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
      url: this.#releasesURL(deploymentId),
      params: buildApiListParams(params)
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentReleaseAdapter.transformList(results),
      count
    }
  }

  listReleasesService = async (deploymentId, params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.releases.list(deploymentId, params),
      () => this.#fetchList(deploymentId, params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getReleaseByIdService = async (deploymentId, releaseId) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}`
    })

    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  createReleaseService = async (deploymentId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#releasesURL(deploymentId),
      body
    })

    this.#invalidateReleases(deploymentId)
    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  patchReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformPatchPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}`,
      body
    })

    this.#invalidateReleases(deploymentId)
    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  buildReleaseService = async (deploymentId, releaseId) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/build`
    })

    this.#invalidateReleases(deploymentId)
    return { data: data?.data ?? data }
  }

  deleteReleaseService = async (deploymentId, releaseId) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}`
    })

    this.#invalidateReleases(deploymentId)
    return { success: true }
  }

  cancelReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformCancelPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/cancel`,
      body
    })

    this.#invalidateReleases(deploymentId)
    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  archiveReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformArchivePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/archive`,
      body
    })

    this.#invalidateReleases(deploymentId)
    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  promoteReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformPromotePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/promote`,
      body
    })

    this.#invalidateReleases(deploymentId)
    if (body.target_deployment_id) {
      this.#invalidateReleases(body.target_deployment_id)
    }
    this.#invalidateDeployments()

    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  activateReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformActivatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/activate`,
      body
    })

    this.#invalidateReleases(deploymentId)
    this.#invalidateDeployments()
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  rollbackReleaseService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformRollbackPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/rollback`,
      body
    })

    this.#invalidateReleases(deploymentId)
    this.#invalidateDeployments()
    this.#invalidateDeploymentDetail(deploymentId)

    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  patchReleaseStrategyService = async (deploymentId, releaseId, payload = {}) => {
    const body = DeploymentReleaseAdapter.transformStrategyPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#releasesURL(deploymentId)}/${releaseId}/strategy`,
      body
    })

    this.queryClient.invalidateQueries({
      queryKey: queryKeys.deployments.releases.detail(deploymentId, releaseId)
    })
    this.#invalidateReleases(deploymentId)
    return {
      data: DeploymentReleaseAdapter.transformItem(parseItemResponse(data))
    }
  }

  buildAndActivate = async (deploymentShortId, payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${deploymentShortId}/build_and_activate`,
      body: payload
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.history.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.release.all(deploymentShortId) })
    this.#invalidateReleases(deploymentShortId)
    this.#invalidateDeployments()
    this.#invalidateDeploymentDetail(deploymentShortId)

    return { data: data?.data ?? data }
  }

  getActiveReleaseComposition = async (deploymentShortId) => {
    return await this.useEnsureQueryData(
      queryKeys.release.activeComposition(deploymentShortId),
      async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: `${this.#baseURL}/${deploymentShortId}/releases`,
          params: { traffic_role: 'active' }
        })

        const releases = parseReleaseList(data)

        // The endpoint already filters to the active release; keep a defensive
        // case-insensitive match so only an ACTIVE release is ever returned.
        return (
          releases.find(
            (release) => String(release?.traffic_role).toUpperCase() === ACTIVE_TRAFFIC_ROLE
          ) ?? null
        )
      }
    )
  }
}

export const deploymentReleaseService = new DeploymentReleaseService()
