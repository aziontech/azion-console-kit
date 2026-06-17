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

const POLICY_LABELS = {
  single_version: 'Single Version',
  versioned_urls: 'Versioned URLs'
}

export const mapPolicyToLabel = (policy) => {
  if (!policy) return ''
  return POLICY_LABELS[policy] ?? String(policy)
}

const RESOURCE_TYPE_META = {
  application: { label: 'Application', icon: 'ai ai-edge-application' },
  firewall: { label: 'Firewall', icon: 'ai ai-edge-firewall' },
  custom_page: { label: 'Custom Page', icon: 'ai ai-custom-pages' },
  function: { label: 'Function', icon: 'ai ai-edge-functions' },
  network_list: { label: 'Network List', icon: 'ai ai-network-list' }
}

const snakeToTitle = (value) =>
  String(value)
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const mapResourceTypes = (allowedResourceTypes) => {
  if (!Array.isArray(allowedResourceTypes)) return []
  return allowedResourceTypes
    .map((type) => {
      if (!type) return null
      const meta = RESOURCE_TYPE_META[type]
      return {
        type,
        label: meta?.label ?? snakeToTitle(type),
        icon: meta?.icon ?? 'pi pi-box'
      }
    })
    .filter(Boolean)
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
    trigger: actor.trigger ?? null,
    email: actor.email ?? null
  }
}

const normalizeDeployment = (deployment) => {
  const source = isObject(deployment) ? deployment : {}

  return {
    id: source.id ?? null,
    name: source.name ?? '',
    description: source.description ?? null,
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

export const DeploymentAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeDeployment(item)
      const lastEditor =
        normalized.last_modified_by?.email || normalized.last_modified_by?.user_id || ''
      return {
        ...normalized,
        status: mapStateToStatus(normalized.state),
        policy: normalized.deployment_version_policy,
        policyLabel: mapPolicyToLabel(normalized.deployment_version_policy),
        resourceTypes: mapResourceTypes(normalized.allowed_resource_types),
        lastEditor,
        lastModified: normalized.updated_at
          ? formatDateToDayMonthYearHour(normalized.updated_at)
          : '-'
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
