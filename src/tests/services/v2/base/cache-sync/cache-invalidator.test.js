// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CacheInvalidator } from '@/services/v2/base/cache-sync/cache-invalidator'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

/**
 * CacheInvalidator — turns one SSE activity event into targeted TanStack
 * invalidations. Real invalidation-map; the only seam is the queryClient
 * call itself (asserted, not executed).
 */
let invalidateSpy

beforeEach(() => {
  invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
})

const activityEvent = ({ type, activity = 'edited', id, description, parent } = {}) => ({
  data: {
    resource: { type, parent },
    activity_type: activity,
    metadata: { id },
    description
  }
})

describe('resolution precedence', () => {
  it('a parent on the event wins: invalidates the PARENT cache, not the child', async () => {
    const invalidated = await new CacheInvalidator().invalidate(
      activityEvent({ type: 'cache setting', id: 1, parent: { type: 'Application', id: 9 } })
    )

    expect(invalidated).toEqual([queryKeys.application.detail(9)])
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.application.detail(9),
      refetchType: 'none'
    })
  })

  it('a hyphen parent type counts as absent — falls through to the resource itself', async () => {
    const invalidated = await new CacheInvalidator().invalidate(
      activityEvent({ type: 'workload', id: 5, parent: { type: '-', id: '-' } })
    )

    expect(invalidated).toEqual([queryKeys.workload.all, queryKeys.workload.detail(5)])
  })

  it('without structured fields the human description is the fallback', async () => {
    const invalidated = await new CacheInvalidator().invalidate({
      data: { description: 'Edge Application myapp was updated' }
    })

    expect(invalidated).toEqual([queryKeys.application.all])
  })

  it('an unresolvable event invalidates nothing and touches no cache', async () => {
    const invalidated = await new CacheInvalidator().invalidate(
      activityEvent({ type: 'martian_resource' })
    )

    expect(invalidated).toEqual([])
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it('a malformed event (no data) is safe', async () => {
    await expect(new CacheInvalidator().invalidate({})).resolves.toEqual([])
  })
})

describe('invalidation is refetch-passive', () => {
  it('every invalidation uses refetchType none (SSE marks stale; views refetch on demand)', async () => {
    await new CacheInvalidator().invalidate(activityEvent({ type: 'application', id: 42 }))

    for (const call of invalidateSpy.mock.calls) {
      expect(call[0].refetchType).toBe('none')
    }
    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })
})
