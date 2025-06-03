import { formatExhibitionDate } from '@/helpers/convert-date'

export const EdgeFirewallAdapter = {
  transformListEdgeFirewall(data) {
    return (
      data?.map(async (edgeFirewall) => {
        return {
          id: edgeFirewall.id,
          name: edgeFirewall.name,
          lastEditor: edgeFirewall.last_editor,
          debugRules: edgeFirewall.debug_rules,
          lastModify: formatExhibitionDate(edgeFirewall.last_modified, 'full', undefined),
          lastModifyDate: edgeFirewall.last_modified,
          status: edgeFirewall.active
            ? {
                content: 'Active',
                severity: 'success'
              }
            : {
                content: 'Inactive',
                severity: 'danger'
              }
        }
      }) || []
    )
  },
  transformLoadEdgeFirewall({ data }) {
    return {
      id: data.id,
      name: data.name,
      isActive: data.active,
      edgeFunctionsEnabled: data.modules.edge_functions_enabled,
      networkProtectionEnabled: data.modules.network_protection_enabled,
      wafEnabled: data.modules.waf_enabled,
      debugRules: data.debug,
      domains: data.domains || [],
      ddosProtectionUnmetered: true
    }
  },
  transformPayload(payload) {
    return {
      name: payload.name,
      active: payload.isActive,
      modules: {
        ddos_protection_enabled: true,
        edge_functions_enabled: payload.edgeFunctionsEnabled,
        network_protection_enabled: payload.networkProtectionEnabled,
        waf_enabled: payload.wafEnabled
      },
      debug: payload.debugRules
    }
  }
}
