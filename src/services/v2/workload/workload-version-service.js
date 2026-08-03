import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { WorkloadVersionAdapter } from './workload-version-adapter'

export class WorkloadVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = WorkloadVersionAdapter
    this.baseURL = 'v4/workspace/workloads'
    this.versionKeys = queryKeys.workload.version
  }

  rollback = async (resourceId, versionId, body = {}) => {
    const payload = this.adapter?.transformActionPayload?.(body) ?? body
    await this.http.request({
      method: 'POST',
      url: this.getUrl(resourceId, versionId, '/rollback'),
      body: payload
    })
    this.queryClient.removeQueries({ queryKey: this.versionKeys.all(resourceId) })
  }
}

export const workloadVersionService = new WorkloadVersionService()
