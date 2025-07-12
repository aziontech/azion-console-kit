import { formatExhibitionDate } from '@/helpers/convert-date'
import { parseStatusData } from '../utils/adapter/parse-status-utils'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  debugRules: (value) => value.debug_rules,
  lastEditor: (value) => value.last_editor,
  lastModify: (value) => formatExhibitionDate(value.last_modified, 'full', undefined),
  lastModified: (value) => value.last_modified,
  active: (value) => parseStatusData(value.active)
}

export const EdgeFirewallAdapter = {
  transformListEdgeFirewall(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },
  transformListEdgeFirewallDropdown(data) {
    return data.map((edgeFirewall) => ({
      id: edgeFirewall.id,
      name: edgeFirewall.name,
      active: edgeFirewall?.active
    }))
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
        ddos_protection: {
          enabled: payload.ddosProtectionUnmetered
        },
        edge_functions: {
          enabled: payload.edgeFunctionsEnabled
        },
        network_protection: {
          enabled: payload.networkProtectionEnabled
        },
        waf: {
          enabled: payload.wafEnabled
        }
      },
      debug: payload.debugRules
    }
  }
}
