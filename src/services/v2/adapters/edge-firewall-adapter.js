import { formatExhibitionDate } from '@/helpers/convert-date'
import { parseStatusData } from '../utils/adapter/parse-status-utils'

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
          status: parseStatusData(edgeFirewall.active)
        }
      }) || []
    )
  },
  transformLoadEdgeFirewall({ data }) {
    return {
      id: data.id,
      name: data.name,
      isActive: data.active,
      edgeFunctionsEnabled: data.modules.edge_functions.enabled,
      networkProtectionEnabled: data.modules.network_protection.enabled,
      wafEnabled: data.modules.waf.enabled,
      debugRules: data.debug,
      domains: data.domains || [],
      ddosProtectionUnmetered: data.modules.ddos_protection.enabled
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
