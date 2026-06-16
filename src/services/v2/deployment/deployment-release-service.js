import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

/**
 * Service for one-shot release dispatch (`build_and_activate`).
 *
 * Creates, builds and activates a release in a single step under
 * `/deployment-api/v4/deployments/{deployment_short_id}/build_and_activate`.
 * On success it removes the deployments history/deployments caches so the
 * release reflects in subsequent listings; API errors (404/422) propagate to
 * the caller untouched so the drawer can surface them without losing form
 * state.
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

    return { data: data?.data ?? data }
  }
}

export const deploymentReleaseService = new DeploymentReleaseService()
