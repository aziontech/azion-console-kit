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

const ARCHIVE_REASONS = new Set(['SUPERSEDED', 'SECURITY_ISSUE', 'POLICY_VIOLATION', 'MANUAL'])

const normalizeGradualRollout = (gradual) => {
  const source = isObject(gradual) ? gradual : {}
  return {
    enabled: Boolean(source.enabled),
    candidate_percentage: source.candidate_percentage ?? null,
    candidate_cookie_name: source.candidate_cookie_name ?? null,
    candidate_cookie_max_age_seconds: source.candidate_cookie_max_age_seconds ?? null,
    candidate_from_deployment_version_id: source.candidate_from_deployment_version_id ?? null
  }
}

const normalizeSkewProtection = (skew) => {
  const source = isObject(skew) ? skew : {}
  return {
    enabled: Boolean(source.enabled),
    cookie_name: source.cookie_name ?? null,
    max_age_seconds: source.max_age_seconds ?? null,
    max_skewed_deployments: source.max_skewed_deployments ?? null
  }
}

const normalizeStrategy = (strategy) => {
  const source = isObject(strategy) ? strategy : {}
  return {
    rollout_mode: source.rollout_mode ?? null,
    gradual_rollout: normalizeGradualRollout(source.gradual_rollout),
    skew_protection: normalizeSkewProtection(source.skew_protection)
  }
}

const normalizeOrigin = (origin) => {
  const source = isObject(origin) ? origin : {}
  return {
    type: source.type ?? null,
    source_environment_id: source.source_environment_id ?? null,
    source_deployment_version_id: source.source_deployment_version_id ?? null,
    promoted_from: source.promoted_from ?? null
  }
}

const normalizeUrls = (urls) => {
  const source = isObject(urls) ? urls : {}
  return {
    canonical_url: source.canonical_url ?? null,
    deployment_url: source.deployment_url ?? null
  }
}

const normalizeAudit = (audit) => {
  const source = isObject(audit) ? audit : {}
  return {
    trigger: source.trigger ?? null,
    requested_by_user_id: source.requested_by_user_id ?? null,
    requested_at: source.requested_at ?? null,
    ready_at: source.ready_at ?? null
  }
}

const normalizeAuditActor = (actor) => {
  if (!isObject(actor)) return null
  return {
    user_id: actor.user_id ?? null,
    trigger: actor.trigger ?? null
  }
}

const normalizeVersion = (version) => {
  const source = isObject(version) ? version : {}

  return {
    id: source.id ?? null,
    deployment_id: source.deployment_id ?? null,
    resource_version_ids: toStringArray(source.resource_version_ids),
    traffic_role: source.traffic_role ?? null,
    strategy: normalizeStrategy(source.strategy),
    urls: normalizeUrls(source.urls),
    origin: normalizeOrigin(source.origin),
    kivo: isObject(source.kivo) ? source.kivo : null,
    audit: normalizeAudit(source.audit),
    state: source.state ?? null,
    state_detail: source.state_detail ?? null,
    account_id: source.account_id ?? null,
    last_modified_by: normalizeAuditActor(source.last_modified_by),
    created_at: source.created_at ?? null
  }
}

const normalizeResources = (resources) => {
  if (!Array.isArray(resources)) return undefined
  return resources
    .map((resource) => {
      if (!isObject(resource)) return null
      return pickDefined({
        id: resource.id,
        resource_type: resource.resource_type
      })
    })
    .filter(Boolean)
}

export const DeploymentVersionAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => normalizeVersion(item))
  },

  transformItem(data) {
    if (!data) return null
    return normalizeVersion(data)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      resources: normalizeResources(payload.resources),
      strategy: payload.strategy,
      origin: payload.origin
    })
  },

  transformActivatePayload(payload = {}) {
    return pickDefined({
      strategy: payload.strategy
    })
  },

  transformRollbackPayload(payload = {}) {
    return pickDefined({
      reason: payload.reason,
      comment: payload.comment
    })
  },

  transformPromotePayload(payload = {}) {
    return pickDefined({
      target_deployment_id: payload.target_deployment_id
    })
  },

  transformStrategyPayload(payload = {}) {
    return pickDefined({
      gradual_rollout: payload.gradual_rollout,
      skew_protection: payload.skew_protection
    })
  },

  transformArchivePayload(payload = {}) {
    const reason = ARCHIVE_REASONS.has(payload.reason) ? payload.reason : undefined
    return pickDefined({
      reason,
      comment: payload.comment
    })
  },

  transformCancelPayload(payload = {}) {
    return pickDefined({
      reason: payload.reason
    })
  },

  transformDiff(data) {
    if (!isObject(data)) return data ?? null
    return data
  }
}
