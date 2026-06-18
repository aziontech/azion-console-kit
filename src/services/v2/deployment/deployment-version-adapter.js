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
    created_at: source.created_at ?? null,
    last_modified_by: resolveActorEmail(source.last_modified_by)
  }
}

export const DeploymentVersionAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeVersion(item)
      return {
        ...normalized,
        status: mapStateToStatus(normalized.state)
      }
    })
  },

  transformItem(data) {
    if (!data) return null
    const normalized = normalizeVersion(data)
    return {
      ...normalized,
      status: mapStateToStatus(normalized.state)
    }
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      resources: normalizePayloadResources(payload.resources),
      strategy: payload.strategy,
      origin: payload.origin
    })
  },

  transformEditDraftPayload(payload = {}) {
    return pickDefined({
      resources: normalizePayloadResources(payload.resources),
      strategy: payload.strategy,
      origin: payload.origin
    })
  },

  transformCancelPayload(payload = {}) {
    return pickDefined({
      reason: payload.reason,
      comment: payload.comment
    })
  },

  transformArchivePayload(payload = {}) {
    return pickDefined({
      reason: payload.reason,
      comment: payload.comment
    })
  }
}
