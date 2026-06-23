import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { NetworkListVersionAdapter } from './network-list-version-adapter'

/**
 * Network List version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ. A global
 * Network List (`client_id:'global'`) is addressed by its own id, so version keys
 * stay scoped per resource and never leak across tenants.
 */
export class NetworkListVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = NetworkListVersionAdapter
    this.baseURL = 'v4/workspace/network_lists'
    this.versionKeys = queryKeys.networkList.version
  }
}

export const networkListVersionService = new NetworkListVersionService()
