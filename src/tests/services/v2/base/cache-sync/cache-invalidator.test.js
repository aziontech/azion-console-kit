import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { CacheInvalidator } from '@services/v2/base/cache-sync/cache-invalidator'

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@services/v2/base/query/queryClient', () => ({
  queryClient: {
    invalidateQueries: (...args) => mockInvalidateQueries(...args)
  }
}))

vi.mock('@services/v2/base/cache-sync/invalidation-map', () => ({
  getKeysForEvents: vi.fn(),
  getKeysForResource: vi.fn(),
  getParentKeys: vi.fn(),
  PARENT_TYPE_TO_QUERY_KEY: {
    Application: 'application',
    'Edge Firewall': 'firewall',
    Workload: 'workload',
    'Edge DNS': 'edgeDNS'
  }
}))

import {
  getKeysForEvents,
  getKeysForResource,
  getParentKeys
} from '@services/v2/base/cache-sync/invalidation-map'

describe('CacheInvalidator', () => {
  let sut

  beforeEach(() => {
    vi.clearAllMocks()
    sut = new CacheInvalidator()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('structured field extraction', () => {
    it('should extract resource.type from activity event', async () => {
      getParentKeys.mockReturnValue([['application', '123']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Application Request Rule',
            parent: { type: 'Application', id: '123' }
          },
          activity_type: 'created',
          metadata: { id: 456 }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '123')
    })

    it('should extract activity_type from activity event', async () => {
      getParentKeys.mockReturnValue([['application', '456']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '456' }
          },
          activity_type: 'edited',
          metadata: { id: 789 }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '456')
    })

    it('should extract metadata.id for reference', async () => {
      getParentKeys.mockReturnValue([['application', '123']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Application Request Rule',
            parent: { type: 'Application', id: '123' }
          },
          activity_type: 'deleted',
          metadata: { id: 789 }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '123')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should handle null resourceId in metadata', async () => {
      getParentKeys.mockReturnValue([['application', '123']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Application Request Rule',
            parent: { type: 'Application', id: '123' }
          },
          activity_type: 'created',
          metadata: { id: null }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '123')
    })

    it('should handle missing metadata', async () => {
      getParentKeys.mockReturnValue([['application', '123']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Application Request Rule',
            parent: { type: 'Application', id: '123' }
          },
          activity_type: 'created'
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '123')
    })
  })

  describe('error logging for invalid payload', () => {
    it('should log error when resource.type is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sut.invalidate({
        data: {
          activity_type: 'created',
          metadata: { id: 123 }
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheSync]',
        expect.objectContaining({
          resourceType: undefined,
          activityType: 'created'
        })
      )

      expect(getParentKeys).not.toHaveBeenCalled()
      expect(mockInvalidateQueries).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should log error when activity_type is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      getKeysForResource.mockReturnValue([])

      await sut.invalidate({
        data: {
          resource: { type: 'edge_application' },
          metadata: { id: 123 }
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheSync]',
        expect.objectContaining({
          resourceType: 'edge_application',
          activityType: undefined
        })
      )

      expect(getParentKeys).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should log error when both resource.type and activity_type are missing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sut.invalidate({
        data: {
          metadata: { id: 123 }
        }
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CacheSync]',
        expect.objectContaining({
          resourceType: undefined,
          activityType: undefined
        })
      )

      consoleSpy.mockRestore()
    })

    it('should log error when event data is null', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sut.invalidate({ data: null })

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should log error when event is null', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await sut.invalidate(null)

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('fallback to description', () => {
    it('should fallback to description when parent.type is not mapped', async () => {
      getParentKeys.mockReturnValue([])

      await sut.invalidate({
        data: {
          resource: {
            type: 'unknown_type',
            parent: { type: 'unknown parent', id: '123' }
          },
          activity_type: 'created',
          description: 'Edge Application was updated'
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('unknown parent', '123')
      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('should not fallback when parent.type returns keys', async () => {
      getParentKeys.mockReturnValue([['application', '123']])
      getKeysForEvents.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '123' }
          },
          activity_type: 'created',
          description: 'Edge Application was updated'
        }
      })

      expect(getParentKeys).toHaveBeenCalled()
      expect(getKeysForEvents).not.toHaveBeenCalled()
    })

    it('should do nothing when neither parent.type nor description match', async () => {
      getParentKeys.mockReturnValue([])

      await sut.invalidate({
        data: {
          resource: {
            type: 'unknown_type',
            parent: { type: 'unknown parent', id: '123' }
          },
          activity_type: 'created',
          description: 'Unknown resource'
        }
      })

      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('should fallback to description when parent is missing', async () => {
      getKeysForResource.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: { type: 'application request rule' },
          activity_type: 'edited',
          description: 'Edge Application was updated'
        }
      })

      expect(getKeysForResource).toHaveBeenCalledWith(
        'application request rule',
        'edited',
        undefined
      )
      expect(mockInvalidateQueries).toHaveBeenCalled()
    })
  })

  describe('parent-based invalidation', () => {
    it('should use parent-based invalidation when parent.type is valid', async () => {
      getParentKeys.mockReturnValue([['application', '1772656941']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '1772656941', name: 'Test App' }
          },
          activity_type: 'edited',
          metadata: { id: '617789' }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '1772656941')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should invalidate listing when parent.id is empty', async () => {
      getParentKeys.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '', name: '' }
          },
          activity_type: 'edited',
          metadata: { id: '617789' }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should invalidate listing when parent.id is hyphen', async () => {
      getParentKeys.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '-', name: '' }
          },
          activity_type: 'edited',
          metadata: { id: '617789' }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '-')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should fallback to description when parent.type is not mapped', async () => {
      getParentKeys.mockReturnValue([])

      await sut.invalidate({
        data: {
          resource: {
            type: 'unknown sub item',
            parent: { type: 'unknown parent', id: '123', name: 'Test' }
          },
          activity_type: 'edited',
          description: 'Edge Application was updated'
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('unknown parent', '123')
      expect(mockInvalidateQueries).not.toHaveBeenCalled()
    })

    it('should fallback to description when parent is missing', async () => {
      getKeysForResource.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: { type: 'application request rule' },
          activity_type: 'edited',
          description: 'Edge Application was updated'
        }
      })

      expect(getKeysForResource).toHaveBeenCalledWith(
        'application request rule',
        'edited',
        undefined
      )
    })

    it('should handle Edge Firewall parent', async () => {
      getParentKeys.mockReturnValue([['edge-firewalls', 'detail', '999']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Firewall Rule Engine',
            parent: { type: 'Edge Firewall', id: '999', name: 'Test Firewall' }
          },
          activity_type: 'edited',
          metadata: { id: '111' }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('edge firewall', '999')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should handle Workload parent', async () => {
      getParentKeys.mockReturnValue([['workloads', 'detail', '42']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'Workload Setting',
            parent: { type: 'Workload', id: '42', name: 'Test Workload' }
          },
          activity_type: 'edited',
          metadata: { id: '222' }
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('workload', '42')
      expect(mockInvalidateQueries).toHaveBeenCalledTimes(1)
    })

    it('should prioritize parent-based over description-based', async () => {
      getParentKeys.mockReturnValue([['application', '123']])
      getKeysForEvents.mockReturnValue([['application']])

      await sut.invalidate({
        data: {
          resource: {
            type: 'application request rule',
            parent: { type: 'application', id: '123', name: 'Test' }
          },
          activity_type: 'edited',
          description: 'Edge Application was updated'
        }
      })

      expect(getParentKeys).toHaveBeenCalledWith('application', '123')
      expect(getKeysForEvents).not.toHaveBeenCalled()
    })
  })
})
