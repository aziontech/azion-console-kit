import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EdgeFirewallVersionAdapter } from './edge-firewall-version-adapter'

/**
 * Edge Firewall version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ.
 */
export class EdgeFirewallVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = EdgeFirewallVersionAdapter
    this.baseURL = 'v4/workspace/firewalls'
    this.versionKeys = queryKeys.firewall.version
  }
}

export const edgeFirewallVersionService = new EdgeFirewallVersionService()
