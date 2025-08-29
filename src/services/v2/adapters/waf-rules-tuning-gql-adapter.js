import {
  parseAndGroupMultipleRules,
  filterRulesByAllowed,
  groupByMatchValueAndPath
} from '@/helpers/convert-waf-rules-tuning'

export const WafRulesTuningGqlAdapter = {
  transformWafRulesTuning(data, allowedRules) {
    const {
      data: { logs }
    } = data
    if (!logs.length) return { data: [], recordsFound: 0 }

    const results = parseAndGroupMultipleRules(logs)

    const rulesNotAllowed = filterRulesByAllowed(results, allowedRules)

    return {
      data: rulesNotAllowed,
      recordsFound: rulesNotAllowed.length
    }
  },

  transformWafRulesTuningAttacks(data, tuningId) {
    const {
      data: { logs }
    } = data
    if (!logs.length) return { data: [], recordsFound: 0 }

    const results = parseAndGroupMultipleRules(logs, true)
    const grouped = groupByMatchValueAndPath(results, tuningId)

    return {
      data: grouped,
      recordsFound: grouped.length
    }
  }
}
