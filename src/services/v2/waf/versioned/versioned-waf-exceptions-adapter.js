import { WafAdapter } from '@/services/v2/waf/waf-adapter'

/**
 * Adapter for the versioned WAF exceptions (allowed rules) sub-resource.
 * Reuses WafAdapter so the allowed-rule shape stays identical to the
 * non-versioned siblings; exposes the generic factory method names.
 */
export const VersionedWafExceptionsAdapter = {
  // factory destructures `count` itself; return only the mapped rows
  transformList: (results) => WafAdapter.transformListWafRulesAllowed({ results }).body,
  transformLoad: (data) => WafAdapter.transformLoadWafRuleAllowed(data),
  requestPayload: (payload) => WafAdapter.adaptCreateWafRuleAllowedPayload(payload)
}
