const MAP_BEHAVIOR = {
  run_function: 'functionId',
  set_origin: 'originId',
  set_cache_policy: 'cacheId',
  set_edge_connector: 'edgeConnectorId'
}

const adaptBehavior = (behaviors) => {
  return behaviors.map((behavior) => {
    if (behavior.name === 'capture_match_groups') {
      return {
        type: behavior.name,
        attributes: {
          subject: behavior.subject,
          regex: behavior.regex,
          captured_array_name: behavior.captured_array_name || behavior.captured_array
        }
      }
    }

    const behaviorInt = ['run_function', 'set_edge_connector', 'set_cache_policy']
    if (behaviorInt.includes(behavior.name)) {
      return {
        type: behavior.name,
        attributes: {
          value: parseInt(behavior[MAP_BEHAVIOR[behavior.name]])
        }
      }
    }

    const behaviorString = [
      'redirect_to_301',
      'redirect_to_302',
      'set_header',
      'set_cookie',
      'rewrite_request',
      'filter_request_header',
      'filter_request_cookie',
      'add_request_header',
      'add_request_cookie'
    ]
    if (behaviorString.includes(behavior.name)) {
      return {
        type: behavior.name,
        attributes: {
          value: behavior[MAP_BEHAVIOR[behavior.name] || 'target']
        }
      }
    }

    // BehaviorNoArg (deny, deliver, no-content, etc)
    return {
      type: behavior.name
    }
  })
}

const parsedBehavior = (behaviors) => {
  return behaviors.map((behavior) => {
    let behaviorItem = { [MAP_BEHAVIOR[behavior.type] || 'target']: behavior.attributes.value }
    if (behavior.type === 'capture_match_groups') {
      behaviorItem = { ...behavior.attributes }
    }
    if (behavior.type === 'set_cache_policy' && typeof behavior.attributes.value === 'number') {
      behaviorItem = { cacheId: behavior.attributes.value.toString() }
    }
    if (behavior.type === 'set_origin' && typeof behavior.attributes.value === 'number') {
      behaviorItem = { originId: behavior.attributes.value.toString() }
    }
    if (behavior.type === 'set_edge_connector' && typeof behavior.attributes.value === 'number') {
      behaviorItem = { edgeConnectorId: parseInt(behavior.attributes.value) }
    }
    if (behavior.type === 'run_function') {
      behaviorItem = { functionId: behavior.attributes.value.toString() }
    }

    return {
      name: behavior.type,
      ...behaviorItem
    }
  })
}

export { adaptBehavior, parsedBehavior }
