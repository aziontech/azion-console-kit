import { adaptBehavior, parsedBehavior } from '@/helpers/helper-behavior'
import { adaptCriteria } from '@/helpers/helper-criteria'
import { formatExhibitionDate, convertToRelativeTime } from '@/helpers/convert-date'
import { capitalizeFirstLetter } from '@/helpers/capitalize-first-letter'

export const RulesEngineAdapter = {
  transformListRulesEngine(data, phase) {
    const statusMap = {
      true: { content: 'Active', severity: 'success' },
      false: { content: 'Inactive', severity: 'danger' }
    }

    const response =
      data?.map((rule, index) => ({
        id: rule.id,
        stringId: rule.id?.toString(),
        name: rule.name,
        phase: {
          content: capitalizeFirstLetter(phase),
          outlined: true,
          severity: 'info'
        },
        behaviors: rule.behaviors,
        criteria: rule.criteria,
        status: statusMap[rule.active],
        position: {
          value: index,
          immutableValue: index,
          altered: false,
          min: 0,
          max: data.length - 1,
          phase: phase
        },
        description: rule.description || '-',
        lastEditor: rule.last_editor || '-',
        lastModified: formatExhibitionDate(rule.last_modified, 'full'),
        lastModify: convertToRelativeTime(rule.last_modified)
      })) || []

    return response
  },

  transformCreateRulesEngine(payload) {
    return {
      name: payload.name,
      phase: payload.phase,
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
    const requestData = newOrderData.filter((el) => el.phase.content.toLowerCase() === 'request')
    const responseData = newOrderData.filter((el) => el.phase.content.toLowerCase() === 'response')

    const requestIds = requestData.map((data) => data.id)
    const responseIds = responseData.map((data) => data.id)

    return {
      request: requestIds,
      response: responseIds
    }
  },

  transformLoadRulesEngine(response, phase) {
    const rule = response.data

    return {
      id: rule.id,
      stringId: rule.id?.toString(),
      name: rule.name,
      phase,
      criteria: rule.criteria,
      behaviors: parsedBehavior(rule.behaviors),
      isActive: rule.active,
      order: rule.order,
      description: rule.description
    }
  }
}
