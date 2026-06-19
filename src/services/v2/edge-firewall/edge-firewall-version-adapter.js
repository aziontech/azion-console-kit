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
  if (raw.name != null) ui.name = raw.name
  if (raw.active != null) ui.isActive = raw.active
  if (raw.edge_functions_enabled != null) ui.edgeFunctionsEnabled = raw.edge_functions_enabled
  if (raw.network_protection_enabled != null) {
    ui.networkProtectionEnabled = raw.network_protection_enabled
  }
  if (raw.waf_enabled != null) ui.wafEnabled = raw.waf_enabled
  if (raw.ddos_protection_unmetered != null) {
    ui.ddosProtectionUnmetered = raw.ddos_protection_unmetered
  }
  if (raw.debug_rules != null) ui.debugRules = raw.debug_rules

  return ui
}

// Maps UI form values into the flat snake_case Firewall body fields.
const mapResourceFields = (values = {}) => ({
  name: values.name,
  active: values.isActive,
  edge_functions_enabled: values.edgeFunctionsEnabled,
  network_protection_enabled: values.networkProtectionEnabled,
  waf_enabled: values.wafEnabled,
  ddos_protection_unmetered: values.ddosProtectionUnmetered,
  debug_rules: values.debugRules
})

export const EdgeFirewallVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
