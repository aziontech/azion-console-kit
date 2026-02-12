export const parseCriteria = (criteria) => {
  const argumentTransformers = {
    '${network}': (arg) => parseInt(arg)
  }

  return criteria.map((criterionGroup) =>
    criterionGroup.map((criterion) => {
      return {
        ...criterion,
        argument: argumentTransformers[criterion.variable]
          ? argumentTransformers[criterion.variable](criterion.argument)
          : criterion.argument
      }
    })
  )
}

export const parseBehaviors = (behaviors) => {
  const parsedBehaviors = behaviors.map((behavior) => {
    switch (behavior.name) {
      case 'run_function':
        return {
          type: behavior.name,
          attributes: { value: behavior.functionId }
        }
      case 'set_waf':
        return {
          type: behavior.name,
          attributes: {
            waf_id: Number(behavior.id),
            mode: behavior.mode
          }
        }
      case 'set_rate_limit':
        const typeToEnableBurstSize = 'second'
        const attributes = {
          type: behavior.type,
          limit_by: behavior.limit_by,
          average_rate_limit: Number(behavior.average_rate_limit)
        }

        if (behavior.type === typeToEnableBurstSize) {
          attributes.maximum_burst_size = Number(behavior.maximum_burst_size)
        }

        return {
          type: behavior.name,
          attributes
        }
      case 'set_custom_response':
        return {
          type: behavior.name,
          attributes: {
            status_code: behavior.status_code,
            content_type: behavior.content_type,
            content_body: behavior.content_body
          }
        }
      default:
        return {
          type: behavior.name
        }
    }
  })

  return parsedBehaviors
}

/**
 * Parse each criteria based on its type
 * @param {Array} criteria
 * @returns {Array}
 */
export const parseCriteriaLoad = (criteria) => {
  const parsedCriteria = criteria.map((criterionGroup) => {
    return criterionGroup.map((criterion) => {
      switch (criterion.variable) {
        case '${network}':
          return {
            ...criterion,
            argument: criterion.argument.toString()
          }
        default:
          return criterion
      }
    })
  })

  return parsedCriteria
}

/**
 * Parse each behavior based on its type
 * @param {Array} behaviors
 * @returns {Array}
 */
export const parseBehaviorsLoad = (behaviors) => {
  const parsedBehaviors = behaviors.map((behavior) => {
    switch (behavior.type) {
      case 'run_function':
        return {
          name: behavior.type,
          functionId: parseInt(behavior.attributes.value)
        }

      case 'set_waf':
        return {
          name: behavior.type,
          mode: behavior.attributes.mode,
          id: Number(behavior.attributes.waf_id)
        }
      case 'set_rate_limit':
        return {
          name: behavior.type,
          type: behavior.attributes.type,
          limit_by: behavior.attributes.limit_by,
          average_rate_limit: behavior.attributes.average_rate_limit,
          maximum_burst_size: behavior.attributes.maximum_burst_size
        }
      case 'set_custom_response':
        return {
          name: behavior.type,
          status_code: behavior.attributes.status_code,
          content_type: behavior.attributes.content_type,
          content_body: behavior.attributes.content_body
        }
      default:
        return {
          name: behavior.type
        }
    }
  })

  return parsedBehaviors
}
