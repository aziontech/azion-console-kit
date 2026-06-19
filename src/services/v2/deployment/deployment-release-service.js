import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

const ACTIVE_TRAFFIC_ROLE = 'ACTIVE'

const parseReleaseList = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  return []
}

/**
 * Service for one-shot release dispatch (`build_and_activate`) and reading the
 * active release composition.
 *
 * Creates, builds and activates a release in a single step under
 * `/deployment-api/v4/deployments/{deployment_short_id}/build_and_activate`.
 * On success it removes the deployments history/deployments caches and the
 * release caches of the target deployment so the composition reflects in
 * subsequent reads; API errors (404/422) propagate to the caller untouched so
 * the drawer can surface them without losing form state.
 */
export class DeploymentReleaseService extends BaseService {
  #baseURL = '/deployment-api/v4/deployments'

  buildAndActivate = async (deploymentShortId, payload) => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${deploymentShortId}/build_and_activate`,
      body: payload
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.history.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.release.all(deploymentShortId) })

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
