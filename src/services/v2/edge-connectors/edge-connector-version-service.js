import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeConnectorVersionAdapter } from './edge-connector-version-adapter'

/**
 * Edge Connector version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ.
 */
export class EdgeConnectorVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = EdgeConnectorVersionAdapter
    this.baseURL = 'v4/workspace/connectors'
    this.versionKeys = queryKeys.connector.version
  }
}

export const edgeConnectorVersionService = new EdgeConnectorVersionService()
