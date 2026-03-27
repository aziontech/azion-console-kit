import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { PrefetchExecutor } from '@services/v2/base/cache-sync/prefetch-executor'

const createMockQuery = (options = {}) => ({
  queryKey: options.queryKey || ['test'],
  state: {
    isStale: options.isStale ?? true,
    isFetching: options.isFetching ?? false,
    status: options.status ?? 'success',
    ...options.state
  }
})

describe('PrefetchExecutor', () => {
  let mockQueryCache
  let mockQueryClient
  let mockRegistry
  let executor

  beforeEach(() => {
    mockQueryCache = {
      findAll: vi.fn()
    }

    mockQueryClient = {
      getQueryCache: vi.fn(() => mockQueryCache),
      prefetchQuery: vi.fn().mockResolvedValue(undefined),
      fetchQuery: vi.fn().mockResolvedValue(undefined)
    }

    mockRegistry = {
      has: vi.fn().mockReturnValue(true),
      get: vi.fn().mockReturnValue(() => Promise.resolve({ data: 'mock' })),
      getAllPatterns: vi.fn().mockReturnValue([])
    }

    executor = new PrefetchExecutor({
      queryClient: mockQueryClient,
      registry: mockRegistry
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shouldPrefetch()', () => {
    it('should return true for stale, non-fetching query with queryFn', () => {
      const query = createMockQuery({ isStale: true, isFetching: false })

      const result = executor.shouldPrefetch(query)

      expect(result).toBe(true)
    })

    it('should return false for non-stale query', () => {
      const query = createMockQuery({ isStale: false, isFetching: false })

      const result = executor.shouldPrefetch(query)

      expect(result).toBe(false)
    })

    it('should return false for currently fetching query', () => {
      const query = createMockQuery({ isStale: true, isFetching: true })

      const result = executor.shouldPrefetch(query)

      expect(result).toBe(false)
    })

    it('should return false for query in error state', () => {
      const query = createMockQuery({ isStale: true, isFetching: false, status: 'error' })

      const result = executor.shouldPrefetch(query)

      expect(result).toBe(false)
    })

    it('should return false if no queryFn registered', () => {
      mockRegistry.has.mockReturnValue(false)
      const query = createMockQuery({ isStale: true, isFetching: false })

      const result = executor.shouldPrefetch(query)

      expect(result).toBe(false)
    })
  })

  describe('collectStaleQueries()', () => {
    it('should return only stale queries that should be prefetched', () => {
      const staleQuery = createMockQuery({
        queryKey: ['application', 'all'],
        isStale: true,
        isFetching: false
      })
      const fetchingQuery = createMockQuery({
        queryKey: ['application', 'detail', '123'],
        isStale: true,
        isFetching: true
      })

      mockQueryCache.findAll.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'application' && queryKey[1] === 'all') return [staleQuery]
        if (queryKey[0] === 'application' && queryKey[1] === 'detail') return [fetchingQuery]
        return []
      })

      const keys = [
        ['application', 'all'],
        ['application', 'detail', '123']
      ]
      const result = executor.collectStaleQueries(keys)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(['application', 'all'])
    })

    it('should use findAll for partial key matching', () => {
      const staleQuery1 = createMockQuery({
        queryKey: ['application', { page: 1 }, 'list'],
        isStale: true,
        isFetching: false
      })
      const staleQuery2 = createMockQuery({
        queryKey: ['application', { page: 2 }, 'list'],
        isStale: true,
        isFetching: false
      })

      // findAll returns ALL queries matching the prefix ['application']
      mockQueryCache.findAll.mockReturnValue([staleQuery1, staleQuery2])

      // Invalidate with just ['application'] prefix
      const result = executor.collectStaleQueries([['application']])

      // Should find both queries that start with ['application']
      expect(mockQueryCache.findAll).toHaveBeenCalledWith({ queryKey: ['application'] })
      expect(result).toHaveLength(2)
    })

    it('should deduplicate queries when multiple prefixes match same query', () => {
      const staleQuery = createMockQuery({
        queryKey: ['application', 'detail', '123'],
        isStale: true,
        isFetching: false
      })

      mockQueryCache.findAll.mockReturnValue([staleQuery])

      // Both prefixes match the same query
      const result = executor.collectStaleQueries([['application'], ['application', 'detail']])

      // Should only return the query once
      expect(result).toHaveLength(1)
    })

    it('should return empty array for null input', () => {
      const result = executor.collectStaleQueries(null)

      expect(result).toEqual([])
    })

    it('should return empty array for empty input', () => {
      const result = executor.collectStaleQueries([])

      expect(result).toEqual([])
    })

    it('should skip queries not in cache', () => {
      mockQueryCache.findAll.mockReturnValue([])

      const result = executor.collectStaleQueries([['application', 'all']])

      expect(result).toEqual([])
    })
  })

  describe('execute()', () => {
    it('should prefetch stale queries', async () => {
      const staleQuery = createMockQuery({
        queryKey: ['application', 'all'],
        isStale: true,
        isFetching: false
      })

      mockQueryCache.findAll.mockReturnValue([staleQuery])
      mockRegistry.get.mockReturnValue(() => Promise.resolve({ data: 'test' }))

      await executor.execute([['application', 'all']])

      expect(mockQueryClient.fetchQuery).toHaveBeenCalledWith({
        queryKey: ['application', 'all'],
        queryFn: expect.any(Function),
        staleTime: 60000
      })
    })

    it('should not prefetch non-stale queries', async () => {
      const freshQuery = createMockQuery({
        queryKey: ['application', 'all'],
        isStale: false,
        isFetching: false
      })

      mockQueryCache.findAll.mockReturnValue([freshQuery])

      await executor.execute([['application', 'all']])

      expect(mockQueryClient.fetchQuery).not.toHaveBeenCalled()
    })

    it('should handle empty input', async () => {
      await executor.execute([])

      expect(mockQueryClient.fetchQuery).not.toHaveBeenCalled()
    })

    it('should handle null input', async () => {
      await executor.execute(null)

      expect(mockQueryClient.fetchQuery).not.toHaveBeenCalled()
    })

    it('should continue on prefetch error', async () => {
      const staleQuery1 = createMockQuery({
        queryKey: ['application', 'all'],
        isStale: true
      })
      const staleQuery2 = createMockQuery({
        queryKey: ['application', 'detail', '123'],
        isStale: true
      })

      mockQueryCache.findAll.mockImplementation(({ queryKey }) => {
        if (queryKey[1] === 'all') return [staleQuery1]
        return [staleQuery2]
      })

      mockQueryClient.fetchQuery.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      )
      mockQueryClient.fetchQuery.mockResolvedValueOnce(undefined)

      // Should not throw
      await executor.execute([
        ['application', 'all'],
        ['application', 'detail', '123']
      ])

      expect(mockQueryClient.fetchQuery).toHaveBeenCalledTimes(2)
    })
  })

  describe('prefetch()', () => {
    it('should call fetchQuery with correct args', async () => {
      const queryFn = () => Promise.resolve({ id: 123 })
      mockRegistry.get.mockReturnValue(queryFn)

      await executor.prefetch(['application', 'detail', '123'])

      expect(mockQueryClient.fetchQuery).toHaveBeenCalledWith({
        queryKey: ['application', 'detail', '123'],
        queryFn,
        staleTime: 60000
      })
    })

    it('should handle missing queryFn gracefully', async () => {
      mockRegistry.get.mockReturnValue(null)

      await executor.prefetch(['application', 'all'])

      expect(mockQueryClient.fetchQuery).not.toHaveBeenCalled()
    })

    it('should log and swallow errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockQueryClient.fetchQuery.mockRejectedValue(new Error('Fetch failed'))

      await executor.prefetch(['application', 'all'])

      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})
