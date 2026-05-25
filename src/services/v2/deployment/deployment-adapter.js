import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

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

const STATE_TO_STATUS = {
  ready: { content: 'Ready', severity: 'success' },
  queued: { content: 'Queued', severity: 'info' },
  building: { content: 'Building', severity: 'info' },
  error: { content: 'Error', severity: 'danger' },
  canceled: { content: 'Canceled', severity: 'warning' },
  archiving: { content: 'Archiving', severity: 'secondary' },
  archived: { content: 'Archived', severity: 'secondary' },
  draft: { content: 'Draft', severity: 'info' }
}

export const mapStateToStatus = (state) => {
  if (!state) return { content: 'Unknown', severity: 'secondary' }
  const key = String(state).trim().toLowerCase()
  return STATE_TO_STATUS[key] || { content: String(state), severity: 'secondary' }
}

const snakeToCamel = (segment) => segment.replace(/_([a-z])/g, (_, char) => char.toUpperCase())

const apiResourceTypeToUiKey = (apiType) => {
  if (!apiType) return ''
  const lower = String(apiType).toLowerCase()
  const stripped = lower.startsWith('edge_') ? lower.slice(5) : lower
  return snakeToCamel(stripped)
}

const buildResourcePack = (allowedResourceTypes) => {
  if (!Array.isArray(allowedResourceTypes)) return {}
  return allowedResourceTypes.reduce((acc, type) => {
    const key = apiResourceTypeToUiKey(type)
    if (!key) return acc
    acc[key] = { name: type, hash: '' }
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
    environment: source.environment ?? '',
    name: source.name ?? '',
    description: source.description ?? null,
    active: Boolean(source.active),
    is_current: Boolean(source.is_current),
    duration_seconds: source.duration_seconds ?? null,
    binding_policy: source.binding_policy ?? null,
    deployment_version_policy: source.deployment_version_policy ?? null,
    allowed_resource_types: toStringArray(source.allowed_resource_types),
    strategy_defaults: normalizeStrategyDefaults(source.strategy_defaults),
    state: source.state ?? null,
    state_detail: source.state_detail ?? null,
    client_id: source.client_id ?? null,
    created_at: source.created_at ?? null,
    updated_at: source.updated_at ?? null,
    created_by: normalizeAuditActor(source.created_by),
    last_modified_by: normalizeAuditActor(source.last_modified_by)
  }
}

const formatDuration = (durationSeconds) => {
  if (durationSeconds == null) return ''
  const total = Number(durationSeconds)
  if (!Number.isFinite(total) || total < 0) return ''
  if (total < 60) return `${Math.round(total)}s`
  const minutes = Math.floor(total / 60)
  const seconds = Math.round(total % 60)
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`
}

export const DeploymentAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeDeployment(item)
      return {
        ...normalized,
        status: mapStateToStatus(normalized.state),
        resourcePack: buildResourcePack(normalized.allowed_resource_types),
        lastEditor: normalized.last_modified_by?.user_id ?? '',
        lastModified: normalized.updated_at
          ? formatDateToDayMonthYearHour(normalized.updated_at)
          : '-',
        duration: formatDuration(normalized.duration_seconds),
        hash: '',
        environment: normalized.environment ?? '',
        isCurrent: Boolean(normalized.is_current)
      }
    })
  },

  transformItem(data) {
    if (!data) return null
    return normalizeDeployment(data)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      binding_policy: payload.binding_policy,
      deployment_version_policy: payload.deployment_version_policy,
      allowed_resource_types: payload.allowed_resource_types,
      strategy_defaults: payload.strategy_defaults
    })
  },

  transformPatchPayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      binding_policy: payload.binding_policy,
      deployment_version_policy: payload.deployment_version_policy,
      allowed_resource_types: payload.allowed_resource_types,
      strategy_defaults: payload.strategy_defaults
    })
  }
}
