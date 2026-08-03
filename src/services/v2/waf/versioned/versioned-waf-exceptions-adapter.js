import { WafAdapter } from '@/services/v2/waf/waf-adapter'

export const VersionedWafExceptionsAdapter = {
  transformList: (results) => WafAdapter.transformListWafRulesAllowed({ results }).body,
  transformLoad: (data) => WafAdapter.transformLoadWafRuleAllowed(data),
  requestPayload: (payload) => WafAdapter.adaptCreateWafRuleAllowedPayload(payload)
}
