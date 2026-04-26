/**
 * Prefetch QueryFn Registrations
 *
 * This module registers query functions for the prefetch system.
 * Each queryKey pattern maps to a fetch function that can be called by PrefetchExecutor.
 *
 * Registration Pattern:
 * - Register patterns from most specific to most general
 * - Use wildcard '*' for dynamic segments like IDs
 * - QueryFn receives the full queryKey as parameter
 *
 * QueryKey Structures:
 * - Edge Applications: ['application', params, 'list', undefined] (params at index 1)
 *                      ['application', id] for detail
 * - Most other services: ['service', 'list', params] (params at index 2)
 *                         ['service', 'detail', id] for detail
 *
 * IMPORTANT: Keep this file updated when adding new queryKeys or services.
 */

import { prefetchRegistry } from './prefetch-query-fn-registry'

// Lazy-load services to avoid circular dependencies
// Services are only imported when the queryFn is called

/**
 * Registers all queryFns for prefetch.
 * Called during application bootstrap.
 */
export function registerPrefetchQueryFns() {
  // =========================================================================
  // Edge Applications
  // =========================================================================

  // Special structure: ['application', params, 'list', undefined] or ['application', id]
  prefetchRegistry.register(['application'], async (queryKey) => {
    const { edgeAppService } = await import('../../edge-app/edge-app-service')

    // List query: ['application', params, 'list', undefined]
    if (queryKey.length >= 3 && queryKey[2] === 'list') {
      return edgeAppService.prefetchList()
    }

    // Detail query: ['application', id]
    if (queryKey[1] && typeof queryKey[1] !== 'object') {
      const id = queryKey[1]
      return edgeAppService.loadEdgeApplicationService({ id })
    }

    // Fallback for generic 'all' key
    return edgeAppService.listEdgeApplicationsService({})
  })

  // =========================================================================
  // Workloads - Structure: ['workloads', 'list', params] or ['workloads', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['workloads', 'list'], async () => {
    const { workloadService } = await import('../../workload/workload-service')
    return workloadService.prefetchList()
  })

  prefetchRegistry.register(['workloads', 'detail'], async (queryKey) => {
    const { workloadService } = await import('../../workload/workload-service')
    const id = queryKey[2]
    return workloadService.loadWorkload({ id })
  })

  // =========================================================================
  // Edge Firewalls - Structure: ['edge-firewalls', 'list', params] or ['edge-firewalls', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-firewalls', 'list'], async () => {
    const { edgeFirewallService } = await import('../../edge-firewall/edge-firewall-service')
    return edgeFirewallService.prefetchList()
  })

  prefetchRegistry.register(['edge-firewalls', 'detail'], async (queryKey) => {
    const { edgeFirewallService } = await import('../../edge-firewall/edge-firewall-service')
    const id = queryKey[2]
    return edgeFirewallService.loadEdgeFirewallService({ id })
  })

  // =========================================================================
  // Edge DNS - Structure: ['edge-dns', 'list', params] or ['edge-dns', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-dns', 'list'], async () => {
    const { edgeDNSService } = await import('../../edge-dns/edge-dns-service')
    return edgeDNSService.prefetchList()
  })

  prefetchRegistry.register(['edge-dns', 'detail'], async (queryKey) => {
    const { edgeDNSService } = await import('../../edge-dns/edge-dns-service')
    const id = queryKey[2]
    return edgeDNSService.loadEdgeDNSService({ id })
  })

  // =========================================================================
  // Edge Storage Buckets - Structure: ['edge-storage', 'buckets', 'list', params]
  // =========================================================================

  prefetchRegistry.register(['edge-storage', 'buckets'], async () => {
    const { edgeStorageService } = await import('../../edge-storage/edge-storage-service')
    return edgeStorageService.prefetchList()
  })

  // =========================================================================
  // Data Streams - Structure: ['data-streams', 'list', params] or ['data-streams', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['data-streams', 'list'], async () => {
    const { dataStreamService } = await import('../../data-stream/data-stream-service')
    return dataStreamService.prefetchList()
  })

  prefetchRegistry.register(['data-streams', 'detail'], async (queryKey) => {
    const { dataStreamService } = await import('../../data-stream/data-stream-service')
    const id = queryKey[2]
    return dataStreamService.loadDataStreamService({ id })
  })

  // =========================================================================
  // Edge Functions - Structure: ['edge-functions', 'list', params] or ['edge-functions', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-functions', 'list'], async () => {
    const { edgeFunctionService } = await import('../../edge-function/edge-function-service')
    return edgeFunctionService.prefetchList()
  })

  prefetchRegistry.register(['edge-functions', 'detail'], async (queryKey) => {
    const { edgeFunctionService } = await import('../../edge-function/edge-function-service')
    const id = queryKey[2]
    return edgeFunctionService.loadEdgeFunctionService({ id })
  })

  // =========================================================================
  // Teams - Structure: ['teams', 'list']
  // =========================================================================

  prefetchRegistry.register(['teams', 'list'], async () => {
    const { teamsService } = await import('../../teams/teams-service')
    return teamsService.listTeams()
  })

  // =========================================================================
  // WAF - Structure: ['waf-rules', 'list', params] or ['waf-rules', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['waf-rules', 'list'], async () => {
    const { wafService } = await import('../../waf/waf-service')
    return wafService.prefetchList()
  })

  prefetchRegistry.register(['waf-rules', 'detail'], async (queryKey) => {
    const { wafService } = await import('../../waf/waf-service')
    const id = queryKey[2]
    return wafService.loadWafRule({ id })
  })

  // =========================================================================
  // Network Lists - Structure: ['network-lists', 'list', params] or ['network-lists', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['network-lists', 'list'], async () => {
    const { networkListsService } = await import('../../network-lists/network-lists-service')
    return networkListsService.prefetchList()
  })

  prefetchRegistry.register(['network-lists', 'detail'], async (queryKey) => {
    const { networkListsService } = await import('../../network-lists/network-lists-service')
    const id = queryKey[2]
    return networkListsService.loadNetworkList({ id })
  })

  // =========================================================================
  // Digital Certificates - Structure: ['digital-certificates', 'list', params] or ['digital-certificates', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['digital-certificates', 'list'], async () => {
    const { digitalCertificatesService } =
      await import('../../digital-certificates/digital-certificates-service')
    return digitalCertificatesService.prefetchList()
  })

  prefetchRegistry.register(['digital-certificates', 'detail'], async (queryKey) => {
    const { digitalCertificatesService } =
      await import('../../digital-certificates/digital-certificates-service')
    const id = queryKey[2]
    return digitalCertificatesService.loadDigitalCertificate({ id })
  })

  // =========================================================================
  // Edge Connectors - Structure: ['edge-connectors', 'list', params] or ['edge-connectors', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-connectors', 'list'], async () => {
    const { edgeConnectorsService } = await import('../../edge-connectors/edge-connectors-service')
    return edgeConnectorsService.prefetchList()
  })

  prefetchRegistry.register(['edge-connectors', 'detail'], async (queryKey) => {
    const { edgeConnectorsService } = await import('../../edge-connectors/edge-connectors-service')
    const id = queryKey[2]
    return edgeConnectorsService.loadEdgeConnectorsService({ id })
  })

  // =========================================================================
  // Edge SQL - Structure: ['edge-sql', 'list', params] or ['edge-sql', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-sql', 'list'], async () => {
    const { edgeSQLService } = await import('../../edge-sql/edge-sql-service')
    return edgeSQLService.prefetchList()
  })

  prefetchRegistry.register(['edge-sql', 'detail'], async (queryKey) => {
    const { edgeSQLService } = await import('../../edge-sql/edge-sql-service')
    const id = queryKey[2]
    return edgeSQLService.getDatabase(id)
  })

  // =========================================================================
  // Edge Nodes - Structure: ['edge-nodes', 'list', params] or ['edge-nodes', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-nodes', 'list'], async () => {
    const { edgeNodeService } = await import('../../edge-node/edge-node-service')
    return edgeNodeService.prefetchList()
  })

  prefetchRegistry.register(['edge-nodes', 'detail'], async (queryKey) => {
    const { edgeNodeService } = await import('../../edge-node/edge-node-service')
    const id = queryKey[2]
    return edgeNodeService.loadEdgeNodeService({ id })
  })

  // =========================================================================
  // Edge Services - Structure: ['edge-services', 'list', params] or ['edge-services', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['edge-services', 'list'], async () => {
    const { edgeServiceService } = await import('../../edge-service/edge-service-service')
    return edgeServiceService.prefetchList()
  })

  prefetchRegistry.register(['edge-services', 'detail'], async (queryKey) => {
    const { edgeServiceService } = await import('../../edge-service/edge-service-service')
    const id = queryKey[2]
    return edgeServiceService.loadEdgeServiceService({ id })
  })

  // =========================================================================
  // Custom Pages - Structure: ['custom-pages', 'list', params] or ['custom-pages', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['custom-pages', 'list'], async () => {
    const { customPageService } = await import('../../custom-page/custom-page-service')
    return customPageService.prefetchList()
  })

  prefetchRegistry.register(['custom-pages', 'detail'], async (queryKey) => {
    const { customPageService } = await import('../../custom-page/custom-page-service')
    const id = queryKey[2]
    return customPageService.loadCustomPagesService({ id })
  })

  // =========================================================================
  // Digital Certificates CRL - Structure: ['digital-certificates-crl', 'list', params] or ['digital-certificates-crl', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['digital-certificates-crl', 'list'], async () => {
    const { digitalCertificatesCRLService } =
      await import('../../digital-certificates/digital-certificates-crl-service')
    return digitalCertificatesCRLService.prefetchList()
  })

  prefetchRegistry.register(['digital-certificates-crl', 'detail'], async (queryKey) => {
    const { digitalCertificatesCRLService } =
      await import('../../digital-certificates/digital-certificates-crl-service')
    const id = queryKey[2]
    return digitalCertificatesCRLService.loadDigitalCertificateCRL({ id })
  })

  // =========================================================================
  // Users - Structure: ['users', 'list', params]
  // =========================================================================

  prefetchRegistry.register(['users', 'list'], async () => {
    const { usersService } = await import('../../users/users-service')
    return usersService.prefetchList()
  })

  // =========================================================================
  // Variables - Structure: ['variables', 'list']
  // =========================================================================

  prefetchRegistry.register(['variables', 'list'], async () => {
    const { variablesService } = await import('../../variables/variables-service')
    return variablesService.prefetchList()
  })

  // =========================================================================
  // Personal Tokens - Structure: ['personal-tokens', 'list', params]
  // =========================================================================

  prefetchRegistry.register(['personal-tokens', 'list'], async () => {
    const { personalTokenService } = await import('../../personal-token/personal-token-service')
    return personalTokenService.prefetchList()
  })

  // =========================================================================
  // Team Permissions - Structure: ['team-permissions', 'list', params] or ['team-permissions', 'detail', id]
  // =========================================================================

  prefetchRegistry.register(['team-permissions', 'list'], async () => {
    const { teamPermissionService } = await import('../../team-permission/team-permission-service')
    return teamPermissionService.prefetchList()
  })

  prefetchRegistry.register(['team-permissions', 'detail'], async (queryKey) => {
    const { teamPermissionService } = await import('../../team-permission/team-permission-service')
    const id = queryKey[2]
    return teamPermissionService.load({ id })
  })
}
