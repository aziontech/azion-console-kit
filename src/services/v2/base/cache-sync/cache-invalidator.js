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
   * @param {{ data?: { description?: string } }} event - SSE activity event
   * @returns {Promise<void>}
   */
  async invalidate(event) {
    const description = event?.data?.description
    if (!description) return

    const keysToInvalidate = getKeysForEvents([description])

    // eslint-disable-next-line no-console
    console.log(
      '[CacheSync]',
      description,
      '→',
      keysToInvalidate.length ? keysToInvalidate : 'no match'
    )

    if (keysToInvalidate.length === 0) return

    await Promise.allSettled(
      keysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key }))
    )
  }
}
