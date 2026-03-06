import { getKeysForEvents } from './invalidation-map'
import { queryClient } from '../query/queryClient'

/**
 * CacheInvalidator - Invalidates TanStack Query caches based on SSE activity events.
 *
 * Single Responsibility: receive an activity event, resolve which query keys
 * are affected, and invalidate them.
 */
export class CacheInvalidator {
  /**
   * Invalidates cache based on SSE activity event.
   *
   * @param {Object} event - SSE activity event
   * @param {Object} [event.data] - Event data payload
   * @param {Object} [event.data.resource] - Resource information
   * @param {string} [event.data.resource.type] - Resource type (e.g., 'edge_application')
   * @param {string} [event.data.activity_type] - Activity type ('created', 'edited', 'deleted')
   * @param {Object} [event.data.metadata] - Additional metadata
   * @param {number|string} [event.data.metadata.id] - Resource ID
   * @param {string} [event.data.description] - Human-readable description (fallback)
   * @returns {Promise<void>}
   */
  async invalidate(event) {
    // Extract structured fields from activity event
    const resourceType = event?.data?.resource?.type
    const activityType = event?.data?.activity_type
    const resourceId = event?.data?.metadata?.id
    const description = event?.data?.description

    // Validate payload - log error if required fields are missing
    if (!resourceType || !activityType) {
      const missingFields = []
      if (!resourceType) missingFields.push('data.resource.type')
      if (!activityType) missingFields.push('data.activity_type')

      // eslint-disable-next-line no-console
      console.log('[CacheSync] Invalid activity event payload - missing fields:', {
        missing: missingFields,
        event
      })
      return
    }

    //TODO: this will be implemented in a future issue
    // Try resource.type first (primary method)
    // let keysToInvalidate = getKeysForResource(resourceType, activityType, resourceId)

    // Fallback to description matching for backward compatibility
    // if (keysToInvalidate.length === 0 && description) {
    //   keysToInvalidate = getKeysForEvents([description])
    // }
    const keysToInvalidate = getKeysForEvents([description])

    // eslint-disable-next-line no-console
    console.log(
      '[CacheSync]',
      `${resourceType}:${activityType}`,
      description,
      resourceId != null ? `(id: ${resourceId})` : '',
      '→',
      keysToInvalidate.length ? keysToInvalidate : 'no match'
    )

    if (keysToInvalidate.length === 0) return

    await Promise.allSettled(
      keysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key }))
    )
  }
}
