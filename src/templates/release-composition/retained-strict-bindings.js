import {
  APPLICATION_RESOURCE_TYPE,
  matchFieldFor,
  resourceKey
} from '@/services/v2/release-impact/consuming-deployments/contract'

const activeVersionOf = (resource) =>
  resource?.resource_version ?? resource?.version_id ?? resource?.resource_version_id ?? null

export const retainedStrictBindings = ({
  activeResources,
  composedResources,
  bindingPolicy
} = {}) => {
  if (bindingPolicy !== 'STRICT') return []

  const active = Array.isArray(activeResources) ? activeResources : []
  if (active.length === 0) return []

  const composed = Array.isArray(composedResources) ? composedResources : []
  const composedKeys = new Set(composed.map(resourceKey))

  const seen = new Set()
  const retained = []
  for (const resource of active) {
    if (!resource || resource.resource_type === APPLICATION_RESOURCE_TYPE) continue
    if (resource[matchFieldFor(resource)] == null) continue
    const key = resourceKey(resource)
    if (composedKeys.has(key) || seen.has(key)) continue
    seen.add(key)
    retained.push({
      resource_type: resource.resource_type,
      resource_id: resource.resource_id,
      resource_name: resource.resource_name ?? null,
      resource_version: activeVersionOf(resource)
    })
  }
  return retained
}

const FUNCTION_RESOURCE_TYPE = 'function'
const CONNECTOR_RESOURCE_TYPE = 'connector'

export const functionBelongsToScope = (executionEnvironment, scopedType) =>
  executionEnvironment != null && String(executionEnvironment) === String(scopedType)

export const filterScopedRetained = ({
  resources,
  relatedTypes,
  scopedType,
  showAll,
  functionExecEnvFor,
  ownedConnectorIdsFor
} = {}) => {
  const list = Array.isArray(resources) ? resources : []
  if (showAll) return list

  return list.filter((resource) => {
    const type = resource?.resource_type
    if (relatedTypes && !relatedTypes.has(type)) return false

    if (type === FUNCTION_RESOURCE_TYPE) {
      const executionEnvironment =
        typeof functionExecEnvFor === 'function' ? functionExecEnvFor(resource.resource_id) : null
      return functionBelongsToScope(executionEnvironment, scopedType)
    }

    if (type === CONNECTOR_RESOURCE_TYPE) {
      const owned = typeof ownedConnectorIdsFor === 'function' ? ownedConnectorIdsFor() : null
      return owned instanceof Set && owned.has(String(resource.resource_id))
    }

    return true
  })
}
