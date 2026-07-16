import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { applicationWorkloadResolver } from '@/services/v2/edge-app/edge-app-workload-resolver'
import { firewallWorkloadResolver } from '@/services/v2/edge-firewall/edge-firewall-workload-resolver'

// Registry of Overview-tab configuration per versionable resource type.
// Only the resource types listed here render the Overview tab; adding a new one
// (e.g. function, connector) is a one-line change here plus a resolver module.
export const OVERVIEW_RESOURCE_CONFIG = {
  application: {
    versionService: edgeAppVersionService,
    workloadResolver: applicationWorkloadResolver
  },
  firewall: {
    versionService: edgeFirewallVersionService,
    workloadResolver: firewallWorkloadResolver
  }
}

export const getOverviewConfig = (resourceType) => OVERVIEW_RESOURCE_CONFIG[resourceType] ?? null

export const hasOverviewSupport = (resourceType) => Boolean(getOverviewConfig(resourceType))
