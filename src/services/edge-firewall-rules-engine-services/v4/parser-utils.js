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
          name: behavior.name,
          argument: behavior.functionId
        }
      case 'set_waf_ruleset':
        return {
          name: behavior.name,
          argument: {
            mode: behavior.mode,
            id: behavior.waf_id
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
