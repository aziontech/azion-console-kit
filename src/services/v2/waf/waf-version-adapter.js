import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { WafAdapter } from './waf-adapter'

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  return WafAdapter.transformLoadWafRule({ data: raw })
}

const mapResourceFields = (values = {}) => WafAdapter.adaptWafRulePayload(values)

export const WafVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
