/**
 * Edge Firewall version adapter — only the Firewall-specific exceptions; the
 * common normalization/payload logic comes from `createVersionAdapter`.
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'

// Extracts the Firewall main-settings fields from a version snapshot into the UI
// form shape (camelCase, matching the legacy edge-firewall-adapter).
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  const ui = {}
  const modules = raw.modules ?? {}

  if (raw.name != null) ui.name = raw.name
  if (raw.active != null) ui.isActive = raw.active

  const edgeFunctionsEnabled = modules.functions?.enabled ?? raw.edge_functions_enabled
  if (edgeFunctionsEnabled != null) ui.edgeFunctionsEnabled = edgeFunctionsEnabled

  const networkProtectionEnabled =
    modules.network_protection?.enabled ?? raw.network_protection_enabled
  if (networkProtectionEnabled != null) ui.networkProtectionEnabled = networkProtectionEnabled

  const wafEnabled = modules.waf?.enabled ?? raw.waf_enabled
  if (wafEnabled != null) ui.wafEnabled = wafEnabled

  const ddosProtectionUnmetered = modules.ddos_protection?.enabled ?? raw.ddos_protection_unmetered
  if (ddosProtectionUnmetered != null) ui.ddosProtectionUnmetered = ddosProtectionUnmetered

  const debugRules = raw.debug ?? raw.debug_rules
  if (debugRules != null) ui.debugRules = debugRules

  return ui
}

const mapResourceFields = (values = {}) => ({
  name: values.name,
  active: values.isActive,
  modules: {
    ddos_protection: {
      enabled: values.ddosProtectionUnmetered
    },
    functions: {
      enabled: values.edgeFunctionsEnabled
    },
    network_protection: {
      enabled: values.networkProtectionEnabled
    },
    waf: {
      enabled: values.wafEnabled
    }
  },
  debug: values.debugRules
})

export const EdgeFirewallVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
