/**
 * WAF version adapter — only the WAF Main Settings exceptions; the common
 * normalization/payload logic comes from `createVersionAdapter`. The version
 * snapshot carries the Main Settings (name/active + per-module thresholds and
 * sensitivities); Allowed Rules are a versioned sub-resource (task 4.3).
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { WafAdapter } from './waf-adapter'

// Extracts the WAF Main Settings from a version snapshot into the UI form shape
// (name/active + per-threat booleans and `${threat}Sensitivity`), reusing the
// existing load transform.
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  return WafAdapter.transformLoadWafRule({ data: raw })
}

// Maps the UI form values back to the WAF body fields (name/active +
// engine_settings.attributes.thresholds), reusing the existing payload transform.
const mapResourceFields = (values = {}) => WafAdapter.adaptWafRulePayload(values)

export const WafVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
