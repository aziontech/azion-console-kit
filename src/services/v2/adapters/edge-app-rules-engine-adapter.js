import { adaptBehavior, parsedBehavior } from '@/helpers/helper-behavior'
import { adaptCriteria } from '@/helpers/helper-criteria'

export const RulesEngineAdapter = {
  transformListRulesEngine(data) {
    const statusMap = {
      true: { content: 'Active', severity: 'success' },
      false: { content: 'Inactive', severity: 'danger' }
    }

    const capitalizeFirstLetter = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '')

    return (
      data?.map((rule, index) => ({
        id: rule.id,
        stringId: rule.id?.toString(),
        name: rule.name,
        phase: {
          content: capitalizeFirstLetter(rule.phase),
          outlined: true,
          severity: 'info'
        },
        behaviors: rule.behaviors,
        criteria: rule.criteria,
        status: statusMap[rule.active],
        position: {
          value: index,
          immutableValue: index,
          altered: false
        },
        description: rule.description || '-'
      })) || []
    )
  },

  transformCreateRulesEngine(payload) {
    return {
      name: payload.name,
      phase: payload.phase || 'default',
      active: payload.isActive,
      behaviors: adaptBehavior(payload.behaviors),
      criteria: payload.criteria,
      description: payload.description || ''
    }
  },

  transformEditRulesEngine(payload, reorder = false) {
    if (reorder) {
      return { order: parseInt(payload.order) }
    }
    const { name, phase, behaviors, criteria, isActive, description } = payload
    return {
      name,
      phase: phase?.content || phase,
      behaviors: adaptBehavior(behaviors),
      criteria: adaptCriteria(criteria),
      active: isActive,
      description
    }
  },

  transformReorderRulesEngine(newOrderData) {
    return { order: newOrderData.map((data) => data.id) }
  },

  transformLoadRulesEngine(response) {
    const rule = response.data
    return {
      id: rule.id,
      stringId: rule.id?.toString(),
      name: rule.name,
      phase: rule.phase,
      criteria: rule.criteria,
      behaviors: parsedBehavior(rule.behaviors),
      isActive: rule.active,
      order: rule.order,
      description: rule.description
    }
  }
}
