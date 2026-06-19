import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeAppVersionAdapter } from './edge-app-version-adapter'

/**
 * Application version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ.
 */
export class EdgeAppVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = EdgeAppVersionAdapter
    this.baseURL = 'v4/workspace/applications'
    this.versionKeys = queryKeys.application.version
  }
}

export const edgeAppVersionService = new EdgeAppVersionService()
