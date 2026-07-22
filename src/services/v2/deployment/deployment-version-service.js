import { toValue } from 'vue'
import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { versionListCachePolicy } from '@/services/v2/versioning/version-cache-policy'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

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

export class DeploymentVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = DeploymentVersionAdapter
    this.baseURL = '/deployment-api/v4/deployments'
    this.versionKeys = queryKeys.deployments.versions
  }

  invalidateAfterMutation(deploymentId) {
    super.invalidateAfterMutation(deploymentId)
    this.queryClient.invalidateQueries({ queryKey: queryKeys.deployments.detail(deploymentId) })
  }

  useListVersionsQuery = (deploymentId, params) => {
    const { skipCache, ...rest } = params ?? {}
    const hasParams = Object.keys(rest).length > 0
    const listParams = hasParams ? rest : undefined

    return this.useQuery(
      this.versionKeys.list(toValue(deploymentId), listParams),
      async () => {
        const request = { method: 'GET', url: this.getUrl(toValue(deploymentId)) }
        if (listParams) request.params = listParams
        const { data } = await this.http.request(request)
        const { results, count } = parseListResponse(data)
        return { body: this.adapter.transformListVersions(results), count }
      },
      {
        persist: !skipCache,
        enabled: true,
        skipCache: Boolean(skipCache),
        ...versionListCachePolicy()
      }
    )
  }

  useLoadVersionQuery = (deploymentId, versionId) =>
    this.useQuery(
      this.versionKeys.detail(toValue(deploymentId), toValue(versionId)),
      async () => {
        const { data } = await this.http.request({
          method: 'GET',
          url: this.getUrl(toValue(deploymentId), toValue(versionId))
        })
        return this.adapter.transformLoadVersion(unwrapItem(data))
      },
      { persist: false, enabled: true }
    )

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

  revert = async ({ id, versionId }) => {
    const deploymentId = toValue(id)

    await this.http.request({
      method: 'POST',
      url: this.getUrl(deploymentId, toValue(versionId), '/revert'),
      body: {}
    })

    this.invalidateAfterMutation(deploymentId)

    return 'Deployment successfully reverted'
  }
}

export const deploymentVersionService = new DeploymentVersionService()
