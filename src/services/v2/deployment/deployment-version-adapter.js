import { mapStateToStatus, resolveResourceMeta } from '@/services/v2/deployment/deployment-adapter'

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

const normalizeVersionResources = (resources) => {
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

const normalizePayloadResources = (resources) => {
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

const resolveActorEmail = (actor) => {
  if (typeof actor === 'string') return actor || null
  if (isObject(actor)) return actor.email ?? null
  return null
}

const normalizeVersion = (version) => {
  const source = isObject(version) ? version : {}
  const meta = isObject(source.meta) ? source.meta : {}
  const state = meta.state ?? source.state ?? null

  return {
    id: source.id ?? null,
    deployment_id: source.deployment_id ?? null,
    name: source.name ?? '',
    resources: normalizeVersionResources(source.resources),
    meta: { state },
    state,
    state_detail: source.state_detail ?? null,
    comment: source.description ?? meta.description ?? '',
    createdAt: source.updated_at ?? meta.updated_at ?? source.created_at ?? meta.created_at ?? null,
    lastEditor: resolveActorEmail(source.last_modified_by)
  }
}

const normalizeVersionItem = (data) => {
  const normalized = normalizeVersion(data)
  return {
    ...normalized,
    status: mapStateToStatus(normalized.state)
  }
}

const normalizeDraftPayload = (payload = {}) =>
  pickDefined({
    resources: normalizePayloadResources(payload.resources),
    strategy: payload.strategy,
    origin: payload.origin
  })

const normalizeReasonPayload = (payload = {}) =>
  pickDefined({
    reason: payload.reason,
    comment: payload.comment
  })

// Deployment version adapter aligned to the VersionServiceBase contract,
// preserving deployment-specific normalization (resources[], status via
// mapStateToStatus, last_modified_by). Build/cancel share the reason payload.
export const DeploymentVersionAdapter = {
  transformListVersions(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => normalizeVersionItem(item))
  },

  transformLoadVersion(data) {
    if (!data) return null
    return normalizeVersionItem(data)
  },

  transformCreateDraftPayload(payload = {}) {
    return normalizeDraftPayload(payload)
  },

  transformDraftPayload(payload = {}) {
    return normalizeDraftPayload(payload)
  },

  transformBuildPayload(payload = {}) {
    return normalizeReasonPayload(payload)
  },

  transformArchivePayload(payload = {}) {
    return normalizeReasonPayload(payload)
  }
}

// Backward-compatible aliases: deployment-version-service.js still calls the
// pre-contract names until tasks 4.1/4.3 reconcile the consumers.
DeploymentVersionAdapter.transformList = DeploymentVersionAdapter.transformListVersions
DeploymentVersionAdapter.transformItem = DeploymentVersionAdapter.transformLoadVersion
DeploymentVersionAdapter.transformCreatePayload =
  DeploymentVersionAdapter.transformCreateDraftPayload
DeploymentVersionAdapter.transformEditDraftPayload = DeploymentVersionAdapter.transformDraftPayload
DeploymentVersionAdapter.transformCancelPayload = DeploymentVersionAdapter.transformBuildPayload
