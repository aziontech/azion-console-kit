import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CacheInvalidator } from '@services/v2/base/cache-sync/cache-invalidator'

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@services/v2/base/query/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args) => mockInvalidateQueries(...args)
  }
}))

vi.mock('@services/v2/base/cache-sync/invalidation-map', () => ({
  getKeysForEvents: vi.fn()
}))

import { getKeysForEvents } from '@services/v2/base/cache-sync/invalidation-map'

describe('CacheInvalidator', () => {
  let sut

  beforeEach(() => {
    vi.clearAllMocks()
    sut = new CacheInvalidator()
  })

  it('should invalidate queries for matching event description', async () => {
    getKeysForEvents.mockReturnValue([['application'], ['workload']])

    await sut.invalidate({
      data: {
        resource: { type: 'edge_application' },
        activity_type: 'edited',
        description: 'Edge Application was updated'
      }
    })

    expect(getKeysForEvents).toHaveBeenCalledWith(['Edge Application was updated'])
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2)
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['application'] })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['workload'] })
  })

  it('should do nothing when required fields are missing', async () => {
    await sut.invalidate({ data: {} })

    expect(getKeysForEvents).not.toHaveBeenCalled()
    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })

  it('should do nothing when resource.type is missing', async () => {
    await sut.invalidate({
      data: { activity_type: 'edited', description: 'Test' }
    })

    expect(getKeysForEvents).not.toHaveBeenCalled()
  })

  it('should do nothing when activity_type is missing', async () => {
    await sut.invalidate({
      data: { resource: { type: 'edge_application' }, description: 'Test' }
    })

    expect(getKeysForEvents).not.toHaveBeenCalled()
  })

  it('should do nothing when event is null', async () => {
    await sut.invalidate(null)

    expect(getKeysForEvents).not.toHaveBeenCalled()
  })

  it('should do nothing when no keys match', async () => {
    getKeysForEvents.mockReturnValue([])

    await sut.invalidate({
      data: {
        resource: { type: 'unknown_resource' },
        activity_type: 'created',
        description: 'Unknown resource was created'
      }
    })

    expect(mockInvalidateQueries).not.toHaveBeenCalled()
  })

  it('should not throw when invalidation fails', async () => {
    getKeysForEvents.mockReturnValue([['application']])
    mockInvalidateQueries.mockRejectedValueOnce(new Error('fail'))

    await expect(
      sut.invalidate({
        data: {
          resource: { type: 'edge_application' },
          activity_type: 'deleted',
          description: 'Edge Application was deleted'
        }
      })
    ).resolves.not.toThrow()
  })
})
