import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { prefetchRegistry } from '@services/v2/base/cache-sync/prefetch-query-fn-registry'

describe('prefetchRegistry', () => {
  beforeEach(() => {
    prefetchRegistry.clear()
  })

  afterEach(() => {
    prefetchRegistry.clear()
  })

  describe('register()', () => {
    it('should register a queryFn for a pattern', () => {
      const queryFn = () => Promise.resolve({ data: 'test' })

      prefetchRegistry.register(['application', 'all'], queryFn)

      expect(prefetchRegistry.size).toBe(1)
    })

    it('should throw for non-array pattern', () => {
      expect(() => prefetchRegistry.register('not-an-array', () => {})).toThrow(
        'Pattern must be an array'
      )
    })

    it('should throw for non-function queryFn', () => {
      expect(() => prefetchRegistry.register(['application', 'all'], 'not-a-function')).toThrow(
        'queryFn must be a function'
      )
    })

    it('should allow overwriting existing pattern', () => {
      const queryFn1 = () => Promise.resolve({ data: 1 })
      const queryFn2 = () => Promise.resolve({ data: 2 })

      prefetchRegistry.register(['application', 'all'], queryFn1)
      prefetchRegistry.register(['application', 'all'], queryFn2)

      expect(prefetchRegistry.size).toBe(1)
      expect(prefetchRegistry.get(['application', 'all'])).toBe(queryFn2)
    })
  })

  describe('get()', () => {
    it('should return queryFn for exact match', () => {
      const queryFn = () => Promise.resolve({ data: 'test' })
      prefetchRegistry.register(['application', 'all'], queryFn)

      const result = prefetchRegistry.get(['application', 'all'])

      expect(result).toBe(queryFn)
    })

    it('should return queryFn for prefix match', () => {
      const queryFn = () => Promise.resolve({ data: 'test' })
      prefetchRegistry.register(['application', 'detail'], queryFn)

      const result = prefetchRegistry.get(['application', 'detail', '123'])

      expect(result).toBe(queryFn)
    })

    it('should return null for non-array input', () => {
      const result = prefetchRegistry.get('not-an-array')

      expect(result).toBeNull()
    })

    it('should return null for no match', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))

      const result = prefetchRegistry.get(['firewall', 'all'])

      expect(result).toBeNull()
    })

    it('should return null for shorter query key than pattern', () => {
      prefetchRegistry.register(['application', 'detail', 'id'], () => Promise.resolve({}))

      const result = prefetchRegistry.get(['application', 'detail'])

      expect(result).toBeNull()
    })

    it('should support wildcard matching', () => {
      const queryFn = () => Promise.resolve({ data: 'test' })
      prefetchRegistry.register(['application', 'detail', '*'], queryFn)

      expect(prefetchRegistry.get(['application', 'detail', '123'])).toBe(queryFn)
      expect(prefetchRegistry.get(['application', 'detail', '456'])).toBe(queryFn)
    })

    it('should return first matching pattern', () => {
      const queryFn1 = () => Promise.resolve({ data: 1 })
      const queryFn2 = () => Promise.resolve({ data: 2 })

      prefetchRegistry.register(['application', 'detail'], queryFn1)
      prefetchRegistry.register(['application', '*'], queryFn2)

      // Should return first match (more specific)
      const result = prefetchRegistry.get(['application', 'detail', '123'])

      expect(result).toBe(queryFn1)
    })
  })

  describe('has()', () => {
    it('should return true for matching pattern', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))

      expect(prefetchRegistry.has(['application', 'all'])).toBe(true)
    })

    it('should return false for non-matching pattern', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))

      expect(prefetchRegistry.has(['firewall', 'all'])).toBe(false)
    })

    it('should return false for non-array input', () => {
      expect(prefetchRegistry.has('not-an-array')).toBe(false)
    })
  })

  describe('unregister()', () => {
    it('should remove a registered pattern', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))

      const result = prefetchRegistry.unregister(['application', 'all'])

      expect(result).toBe(true)
      expect(prefetchRegistry.size).toBe(0)
    })

    it('should return false for non-existent pattern', () => {
      const result = prefetchRegistry.unregister(['application', 'all'])

      expect(result).toBe(false)
    })
  })

  describe('clear()', () => {
    it('should remove all registered patterns', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))
      prefetchRegistry.register(['firewall', 'all'], () => Promise.resolve({}))

      prefetchRegistry.clear()

      expect(prefetchRegistry.size).toBe(0)
    })
  })

  describe('size', () => {
    it('should return the number of registered patterns', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))
      prefetchRegistry.register(['firewall', 'all'], () => Promise.resolve({}))

      expect(prefetchRegistry.size).toBe(2)
    })
  })

  describe('getAllPatterns()', () => {
    it('should return all registered patterns', () => {
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({}))
      prefetchRegistry.register(['firewall', 'all'], () => Promise.resolve({}))

      const patterns = prefetchRegistry.getAllPatterns()

      expect(patterns).toHaveLength(2)
      expect(patterns).toContainEqual(['application', 'all'])
      expect(patterns).toContainEqual(['firewall', 'all'])
    })
  })

  describe('integration scenarios', () => {
    it('should support common query patterns', () => {
      // Register typical patterns
      prefetchRegistry.register(['application', 'all'], () => Promise.resolve({ items: [] }))
      prefetchRegistry.register(['application', 'detail'], (key) => Promise.resolve({ id: key[2] }))
      prefetchRegistry.register(['firewall', 'all'], () => Promise.resolve({ items: [] }))

      // Verify lookups work correctly
      expect(prefetchRegistry.has(['application', 'all'])).toBe(true)
      expect(prefetchRegistry.has(['application', 'detail', '123'])).toBe(true)
      expect(prefetchRegistry.has(['firewall', 'all'])).toBe(true)
      expect(prefetchRegistry.has(['workload', 'all'])).toBe(false)
    })
  })
})
