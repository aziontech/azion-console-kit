import { toValue } from 'vue'
import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

// The list endpoint may answer with a bare array or a `{ results|data, count }`
// envelope; the adapter only normalizes items, so the service unwraps both.
const parseListResponse = (data) => {
  if (Array.isArray(data)) {
    return { results: data, count: data.length }
  }
  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
      ? data.data
      : []
  return { results, count: data?.count ?? results.length }
}

const unwrapItem = (data) =>
  data && typeof data === 'object' && !Array.isArray(data) && data.data ? data.data : data

/**
 * Deployment version service. Lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ and
 * the thin wrappers below preserve the return shapes the consumers expect.
 */
export class DeploymentVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = DeploymentVersionAdapter
    this.baseURL = '/deployment-api/v4/deployments'
    this.versionKeys = queryKeys.deployments.versions
  }

  // Deployment mutations also change the deployment row (state/last release), so
  // we invalidate the deployment detail on top of the inherited version cache.
  invalidateAfterMutation(deploymentId) {
    super.invalidateAfterMutation(deploymentId)
    this.queryClient.invalidateQueries({ queryKey: queryKeys.deployments.detail(deploymentId) })
  }

  // Params-aware list (Wave 0): preserves `{ body, count }` and skipCache/params.
  listVersionsService = async (deploymentId, params = {}) => {
    const id = toValue(deploymentId)
    const skipCache = Boolean(params?.skipCache || params?.hasFilter || params?.search)

    const result = await this.useEnsureQueryData(
      queryKeys.deployments.versions.list(id, params),
      async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: this.getUrl(id),
          params
        })
        const { results, count } = parseListResponse(data)
        return { body: this.adapter.transformListVersions(results), count }
      },
      { persist: !skipCache, skipCache }
    )

    return { body: result?.body ?? [], count: result?.count ?? 0 }
  }

  // Thin alias over the create lifecycle; preserves `{ data }` and the extra
  // deployment-detail invalidation via `invalidateAfterMutation`.
  createVersionService = async (deploymentId, payload = {}) => {
    const id = toValue(deploymentId)
    const body = this.adapter.transformCreateDraftPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.getUrl(id),
      body
    })

    this.invalidateAfterMutation(id)

    return { data: this.adapter.transformLoadVersion(unwrapItem(data)) }
  }
}

export const deploymentVersionService = new DeploymentVersionService()
