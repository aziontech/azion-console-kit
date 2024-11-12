const MAP_BEHAVIOR = {
  run_function: 'functionId',
  set_origin: 'originId',
  set_cache_policy: 'cacheId'
}

const adaptBehavior = (behaviors) => {
  return behaviors.map((behavior) => {
    let behaviorTargetValue = { target: behavior[MAP_BEHAVIOR[behavior.name] || 'target'] }
    if (behavior.name === 'capture_match_groups') {
      behaviorTargetValue = {
        target: {
          captured_array: behavior.captured_array,
          subject: behavior.subject,
          regex: behavior.regex
        }
      }
    }

    return {
      name: behavior.name,
      ...behaviorTargetValue
    }
  })
}

const parsedBehavior = (behaviors) => {
  return behaviors.map((behavior) => {
    let behaviorItem = { [MAP_BEHAVIOR[behavior.name] || 'target']: behavior.target }
    if (behavior.name === 'capture_match_groups') {
      behaviorItem = { ...behavior.target }
    }

    if (behavior.name === 'set_origin' && typeof behavior.target === 'number') {
      behaviorItem = { originId: behavior.target.toString() }
    }

    return {
      name: behavior.name,
      ...behaviorItem
    }
  })
}

export { adaptBehavior, parsedBehavior }
