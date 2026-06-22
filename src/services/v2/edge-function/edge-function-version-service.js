import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeFunctionVersionAdapter } from './edge-function-version-adapter'

/**
 * Edge Function version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ.
 */
export class EdgeFunctionVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = EdgeFunctionVersionAdapter
    this.baseURL = 'v4/workspace/functions'
    this.versionKeys = queryKeys.edgeFunction.version
  }
}

export const edgeFunctionVersionService = new EdgeFunctionVersionService()
