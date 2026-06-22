import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { mapStrategyForBuildAndActivate } from '@/services/v2/deployment/strategy-builder'

const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
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
  connector: { label: 'Connector', icon: 'ai ai-edge-connectors' }
}

const snakeToTitle = (value) =>
  String(value)
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

export const resolveResourceMeta = (type) => {
  if (!type) return { type: '', label: '', icon: 'pi pi-box' }
  const meta = RESOURCE_TYPE_META[type]
  return {
    type,
    label: meta?.label ?? snakeToTitle(type),
    icon: meta?.icon ?? 'pi pi-box'
  }
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

const normalizeAuditEmail = (actor) => {
  if (typeof actor === 'string') return actor
  if (isObject(actor)) return actor.email ?? null
  return null
}

const normalizeDeployment = (deployment) => {
  const source = isObject(deployment) ? deployment : {}

  return {
    id: source.id ?? null,
    version_id: source.version_id ?? null,
    name: source.name ?? '',
    description: source.description ?? null,
    binding_policy: source.binding_policy ?? null,
    deployment_policy: source.deployment_policy ?? null,
    strategy_defaults: normalizeStrategyDefaults(source.strategy_defaults),
    state: source.state ?? null,
    state_detail: source.state_detail ?? null,
    client_id: source.client_id ?? null,
    created_at: formatDateToDayMonthYearHour(source.created_at) ?? null,
    updated_at: formatDateToDayMonthYearHour(source.updated_at) ?? null,
    created_by: normalizeAuditEmail(source.created_by),
    last_modified_by: normalizeAuditEmail(source.last_modified_by)
  }
}

export const DeploymentAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeDeployment(item)
      const lastEditor = normalized.last_modified_by || normalized.created_by || ''
      return {
        ...normalized,
        status: mapStateToStatus(normalized.state),
        policy: normalized.deployment_policy,
        policyLabel: mapPolicyToLabel(normalized.deployment_policy),
        lastEditor,
        lastModified: normalized.updated_at || normalized.created_at || '-'
      }
    })
  },

  transformItem(data) {
    if (!data) return null
    const resource = isObject(data) && isObject(data.data) ? data.data : data
    return normalizeDeployment(resource)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      binding_policy: payload.binding_policy,
      deployment_policy: payload.deployment_policy,
      strategy_defaults: payload.strategy_defaults
    })
  },

  transformPatchPayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      binding_policy: payload.binding_policy,
      deployment_policy: payload.deployment_policy,
      strategy_defaults: payload.strategy_defaults
    })
  },

  /**
   * Splits the active release into the raw parts the composable recombines.
   *
   * - `applicationFromRelease`: the `application` resource of the active
   *   release (`{ resourceId, resourceName, resourceVersion }`), or `null`.
   * - `readOnlyResources`: the active release resources EXCLUDING both
   *   `application` and `context.resourceType` (those own dedicated slots).
   *
   * @param {{ resources?: Array<object> } | null} release - Active release as returned by the API.
   * @param {{ resourceType?: string }} [context={}] - Resource under promotion.
   * @returns {{
   *   applicationFromRelease: { resourceId: (number|string), resourceName: (string|null), resourceVersion: (string|null) } | null,
   *   readOnlyResources: Array<{ resourceType: string, resourceId: (number|string), resourceName: (string|null), resourceVersion: (string|null) }>
   * }}
   */
  transformReleaseComposition(release, context = {}) {
    const ctx = isObject(context) ? context : {}
    const resources = isObject(release) && Array.isArray(release.resources) ? release.resources : []

    const application = resources.find((resource) => resource?.resource_type === 'application')

    const applicationFromRelease = application
      ? {
          resourceId: application.resource_id ?? application.global_id ?? null,
          resourceName: application.resource_name ?? application.name ?? null,
          resourceVersion:
            application.resource_version ??
            application.resource_version_id ??
            application.version_id ??
            null
        }
      : null

    const readOnlyResources = resources
      .filter(
        (resource) =>
          resource?.resource_type !== 'application' &&
          String(resource?.resource_type) !== String(ctx.resourceType)
      )
      .map((resource) => ({
        resourceType: resource.resource_type,
        resourceId: resource.resource_id ?? resource.global_id ?? null,
        resourceName: resource.resource_name ?? resource.name ?? null,
        resourceVersion:
          resource.resource_version ?? resource.resource_version_id ?? resource.version_id ?? null
      }))

    return { applicationFromRelease, readOnlyResources }
  },

  transformBuildAndActivatePayload(resources = [], strategy) {
    const resourceRefs = (Array.isArray(resources) ? resources : []).map((resource) => {
      // deployment-api schema: version is `version_id`; the `application`
      // resource is keyed by `global_id`, every other type by `resource_id`.
      // `name`/`resource_version` are rejected as unrecognized keys.
      const isApplication = resource?.resource_type === 'application'
      return pickDefined({
        global_id: isApplication ? resource?.resource_id : undefined,
        resource_id: isApplication ? undefined : resource?.resource_id,
        version_id: resource?.resource_version,
        resource_type: resource?.resource_type
      })
    })

    return pickDefined({
      resources: resourceRefs,
      strategy: mapStrategyForBuildAndActivate(strategy)
    })
  }
}
