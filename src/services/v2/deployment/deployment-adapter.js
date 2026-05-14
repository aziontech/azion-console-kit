const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const toStringArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
}

const pickDefined = (payload) => {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {})
}

const normalizeCanary = (canary) => {
  const source = isObject(canary) ? canary : {}
  return {
    enabled: Boolean(source.enabled),
    default_percentage: source.default_percentage ?? null
  }
}

const normalizeSkewProtectionDefaults = (skew) => {
  const source = isObject(skew) ? skew : {}
  return {
    enabled: Boolean(source.enabled),
    default_ttl_seconds: source.default_ttl_seconds ?? null
  }
}

const normalizeStrategyDefaults = (strategyDefaults) => {
  const source = isObject(strategyDefaults) ? strategyDefaults : {}
  return {
    canary: normalizeCanary(source.canary),
    skew_protection: normalizeSkewProtectionDefaults(source.skew_protection)
  }
}

const normalizeAuditActor = (actor) => {
  if (!isObject(actor)) return null
  return {
    user_id: actor.user_id ?? null,
    trigger: actor.trigger ?? null
  }
}

const normalizeDeployment = (deployment) => {
  const source = isObject(deployment) ? deployment : {}

  return {
    id: source.id ?? null,
    environment_id: source.environment_id ?? null,
    name: source.name ?? '',
    description: source.description ?? null,
    active: Boolean(source.active),
    binding_policy: source.binding_policy ?? null,
    allowed_resource_types: toStringArray(source.allowed_resource_types),
    strategy_defaults: normalizeStrategyDefaults(source.strategy_defaults),
    account_id: source.account_id ?? null,
    created_at: source.created_at ?? null,
    updated_at: source.updated_at ?? null,
    created_by: normalizeAuditActor(source.created_by),
    last_modified_by: normalizeAuditActor(source.last_modified_by)
  }
}

export const DeploymentAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => normalizeDeployment(item))
  },

  transformItem(data) {
    if (!data) return null
    return normalizeDeployment(data)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      environment_id: payload.environment_id,
      name: payload.name,
      description: payload.description,
      active: payload.active,
      binding_policy: payload.binding_policy,
      allowed_resource_types: payload.allowed_resource_types,
      strategy_defaults: payload.strategy_defaults
    })
  },

  transformPatchPayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      active: payload.active,
      binding_policy: payload.binding_policy,
      allowed_resource_types: payload.allowed_resource_types,
      strategy_defaults: payload.strategy_defaults
    })
  }
}
