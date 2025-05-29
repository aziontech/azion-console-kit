import {
  parseCriteria,
  parseBehaviors,
  parseBehaviorsLoad,
  parseCriteriaLoad
} from '../utils/adapter/rule-engine-utils'

import { getCurrentTimezone } from '@/helpers'

const STATUS_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

export const EdgeFirewallRulesEngineAdapter = {
  transformListEdgeFirewallRulesEngine(data) {
    return (
      data?.map((rules, index) => {
        return {
          id: rules.id,
          name: rules.name,
          description: rules.description || '',
          lastModified: getCurrentTimezone(rules.last_modified),
          lastEditor: rules.last_editor,
          status: STATUS_AS_TAG[rules.active],
          position: {
            value: index,
            immutableValue: index,
            altered: false,
            min: 0,
            max: data.length - 1
          }
        }
      }) || []
    )
  },

  transformPayloadRulesEngine(payload) {
    return {
      name: payload.name,
      description: payload.description,
      active: payload.active,
      criteria: parseCriteria(payload.criteria),
      behaviors: parseBehaviors(payload.behaviors)
    }
  },

  transformLoadEdgeFirewallRulesEngine({ data }) {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      active: data.active,
      criteria: parseCriteriaLoad(data.criteria),
      behaviors: parseBehaviorsLoad(data.behaviors)
    }
  },

  transformReorderEdgeFirewallRulesEngine(data) {
    const listNewOrderDataIds = data.map((data) => data.id)

    return { order: listNewOrderDataIds }
  }
}
