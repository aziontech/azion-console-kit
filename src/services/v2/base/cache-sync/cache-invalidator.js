import { getKeysForEvents, getKeysForResource, getParentKeys } from './invalidation-map'
import { queryClient } from '../query/queryClient'

/**
 * CacheInvalidator - Invalidates TanStack Query caches based on SSE activity events.
 *
 * Single Responsibility: receive an activity event, resolve which query keys
 * are affected, and invalidate them.
 */
function isEmptyOrHyphen(value) {
  if (value == null) return true
  if (value === '') return true
  if (String(value).trim() === '-') return true
  return false
}

export class CacheInvalidator {
  /**
   * Invalidates cache based on SSE activity event.
   *
   * @param {Object} event - SSE activity event
   * @param {Object} [event.data] - Event data payload
   * @param {Object} [event.data.resource] - Resource information
   * @param {string} [event.data.resource.type] - Resource type (e.g., 'application')
   * @param {string} [event.data.activity_type] - Activity type ('created', 'edited', 'deleted')
   * @param {Object} [event.data.metadata] - Additional metadata
   * @param {number|string} [event.data.metadata.id] - Resource ID
   * @param {string} [event.data.description] - Human-readable description (fallback)
   * @returns {Promise<Array>} Array of invalidated query keys
   */
  async invalidate(event) {
    // Extract structured fields from activity event
    const resourceType = event?.data?.resource?.type?.toLowerCase()
    const activityType = event?.data?.activity_type?.toLowerCase()
    const resourceId = event?.data?.metadata?.id
    const description = event?.data?.description
    const parentType = event?.data?.resource?.parent?.type?.toLowerCase()
    const parentId = event?.data?.resource?.parent?.id

    // Validate payload - log error if required fields are missing
    if (!resourceType || !activityType) {
      const missingFields = []
      if (!resourceType) missingFields.push('data.resource.type')
      if (!activityType) missingFields.push('data.activity_type')
    }

    let keysToInvalidate = []
    if (!isEmptyOrHyphen(parentType)) {
      keysToInvalidate = getParentKeys(parentType, parentId)
    } else if (resourceType) {
      keysToInvalidate = getKeysForResource(resourceType, activityType, resourceId)
    } else if (description) {
      keysToInvalidate = getKeysForEvents([description])
    }

    if (keysToInvalidate.length === 0) return []

    await Promise.allSettled(
      keysToInvalidate.map((key) =>
        queryClient.invalidateQueries({ queryKey: key, refetchType: 'none' })
      )
    )

    return keysToInvalidate
  }
}
