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
      case 'tag_event':
        return {
          name: behavior.name,
          argument: behavior.tag_event
        }
      case 'run_function':
        return {
          name: behavior.name,
          argument: behavior.functionId
        }
      case 'set_waf_ruleset':
        return {
          name: behavior.name,
          argument: {
            mode: behavior.mode,
            id: behavior.id
          }
        }
      case 'set_rate_limit':
        const typeToEnableBurstSize = 'second'
        const argument = {
          type: behavior.type,
          limit_by: behavior.limit_by,
          average_rate_limit: Number(behavior.average_rate_limit)
        }

        if (behavior.type === typeToEnableBurstSize) {
          argument.maximum_burst_size = Number(behavior.maximum_burst_size)
        }

        return {
          name: behavior.name,
          argument
        }
      case 'set_custom_response':
        return {
          name: behavior.name,
          argument: {
            status_code: behavior.status_code,
            content_type: behavior.content_type,
            content_body: behavior.content_body
          }
        }
      default:
        return {
          name: behavior.name
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
    switch (behavior.name) {
      case 'run_function':
        return {
          name: behavior.name,
          functionId: parseInt(behavior.argument)
        }

      case 'tag_event':
        return {
          name: behavior.name,
          tag_event: behavior.argument
        }

      case 'set_waf':
        return {
          name: behavior.name,
          mode: behavior.argument.mode,
          id: Number(behavior.argument.id)
        }
      case 'set_rate_limit':
        return {
          name: behavior.name,
          type: behavior.argument.type,
          limit_by: behavior.argument.limit_by,
          average_rate_limit: behavior.argument.average_rate_limit,
          maximum_burst_size: behavior.argument.maximum_burst_size
        }
      case 'set_custom_response':
        return {
          name: behavior.name,
          status_code: behavior.argument.status_code,
          content_type: behavior.argument.content_type,
          content_body: behavior.argument.content_body
        }
      default:
        return {
          name: behavior.name
        }
    }
  })

  return parsedBehaviors
}
