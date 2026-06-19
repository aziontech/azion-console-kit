import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { mapStateToStatus, resolveResourceMeta } from '@/services/v2/deployment/deployment-adapter'

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

const TRAFFIC_ROLE_TO_ENV_LABEL = {
  ACTIVE: 'Production',
  CANDIDATE: 'Canary',
  VALID_URL: 'Stage',
  INACTIVE: 'Stage'
}

const TRAFFIC_ROLES_WITH_HISTORY_ICON = new Set(['VALID_URL', 'INACTIVE'])

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
    requested_by_email: source.requested_by_email ?? null,
    requested_at: source.requested_at ?? null,
    ready_at: source.ready_at ?? null
  }
}

const normalizeAuditActor = (actor) => {
  if (!isObject(actor)) return null
  return {
    user_id: actor.user_id ?? null,
    trigger: actor.trigger ?? null,
    email: actor.email ?? null
  }
}

const normalizeReleaseResources = (resources) => {
  if (!Array.isArray(resources)) return []
  return resources
    .map((resource) => {
      if (!isObject(resource)) return null
      const type = resource.resource_type ?? null
      const meta = resolveResourceMeta(type)
      return {
        id: resource.resource_id ?? null,
        type,
        label: meta.label,
        icon: meta.icon,
        name: resource.resource_name ?? '',
        versionId: resource.resource_version_id ?? null
      }
    })
    .filter(Boolean)
}

const normalizeRelease = (release) => {
  const source = isObject(release) ? release : {}

  return {
    id: source.id ?? null,
    deployment_id: source.deployment_id ?? null,
    name: source.name ?? '',
    resource_version_ids: toStringArray(source.resource_version_ids),
    resources: normalizeReleaseResources(source.resources),
    traffic_role: source.traffic_role ?? null,
    strategy: normalizeStrategy(source.strategy),
    urls: normalizeUrls(source.urls),
    origin: normalizeOrigin(source.origin),
    kivo: isObject(source.kivo) ? source.kivo : null,
    audit: normalizeAudit(source.audit),
    state: source.state ?? null,
    state_detail: source.state_detail ?? null,
    client_id: source.client_id ?? null,
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

const formatDurationFromAudit = (requestedAt, readyAt) => {
  if (!requestedAt || !readyAt) return ''
  const start = new Date(requestedAt).getTime()
  const end = new Date(readyAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return ''
  const totalSeconds = Math.round((end - start) / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`
}

const deriveDisplayFields = (normalized) => {
  const trafficRole = normalized.traffic_role
  const envLabel = TRAFFIC_ROLE_TO_ENV_LABEL[trafficRole] || ''
  return {
    status: mapStateToStatus(normalized.state),
    isCurrent: trafficRole === 'ACTIVE',
    environmentLabel: envLabel,
    environmentIcon: TRAFFIC_ROLES_WITH_HISTORY_ICON.has(trafficRole) ? 'pi pi-history' : null,
    duration: formatDurationFromAudit(normalized.audit?.requested_at, normalized.audit?.ready_at),
    lastEditor:
      normalized.audit?.requested_by_email ||
      normalized.last_modified_by?.email ||
      normalized.audit?.requested_by_user_id ||
      normalized.last_modified_by?.user_id ||
      '',
    lastModified: normalized.created_at ? formatDateToDayMonthYearHour(normalized.created_at) : '-'
  }
}

export const DeploymentReleaseAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeRelease(item)
      return {
        ...normalized,
        ...deriveDisplayFields(normalized)
      }
    })
  },

  transformItem(data) {
    if (!data) return null
    const normalized = normalizeRelease(data)
    return {
      ...normalized,
      ...deriveDisplayFields(normalized)
    }
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      resources: normalizeResources(payload.resources),
      strategy: payload.strategy,
      origin: payload.origin
    })
  },

  transformPatchPayload(payload = {}) {
    return pickDefined({
      resources: normalizeResources(payload.resources),
      strategy: payload.strategy,
      origin: payload.origin
    })
  },

  transformEditDraftPayload(payload = {}) {
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
  }
}
