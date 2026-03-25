import { describe, expect, it } from 'vitest'

// We'll import the actual function after implementation
// For now, we'll test the logic inline and then verify integration

/**
 * normalizeParams - removes empty arrays from params object
 * This ensures that { fields: [] } generates the same cache key as {}
 */
const normalizeParams = (params) => {
  if (!params || typeof params !== 'object') return params

  const normalized = { ...params }

  for (const key of Object.keys(normalized)) {
    if (Array.isArray(normalized[key]) && normalized[key].length === 0) {
      delete normalized[key]
    }
  }

  return normalized
}

describe('normalizeParams', () => {
  describe('when params is falsy', () => {
    it('should return undefined when params is undefined', () => {
      expect(normalizeParams(undefined)).toBeUndefined()
    })

    it('should return null when params is null', () => {
      expect(normalizeParams(null)).toBeNull()
    })
  })

  describe('when params is not an object', () => {
    it('should return the value as-is for string', () => {
      expect(normalizeParams('string')).toBe('string')
    })

    it('should return the value as-is for number', () => {
      expect(normalizeParams(123)).toBe(123)
    })
  })

  describe('when params contains empty arrays', () => {
    it('should remove fields: [] from params', () => {
      const params = { fields: [] }
      const result = normalizeParams(params)
      expect(result).toEqual({})
    })

    it('should remove multiple empty arrays from params', () => {
      const params = { fields: [], otherArray: [], page: 1 }
      const result = normalizeParams(params)
      expect(result).toEqual({ page: 1 })
    })

    it('should remove empty array but keep other properties', () => {
      const params = {
        page: 1,
        pageSize: 10,
        fields: [],
        ordering: '-last_modified'
      }
      const result = normalizeParams(params)
      expect(result).toEqual({
        page: 1,
        pageSize: 10,
        ordering: '-last_modified'
      })
    })
  })

  describe('when params contains non-empty arrays', () => {
    it('should keep fields array with elements', () => {
      const params = { fields: ['id', 'name'] }
      const result = normalizeParams(params)
      expect(result).toEqual({ fields: ['id', 'name'] })
    })

    it('should keep arrays with single element', () => {
      const params = { fields: ['id'] }
      const result = normalizeParams(params)
      expect(result).toEqual({ fields: ['id'] })
    })
  })

  describe('when params contains other types', () => {
    it('should keep string values', () => {
      const params = { search: 'test', fields: [] }
      const result = normalizeParams(params)
      expect(result).toEqual({ search: 'test' })
    })

    it('should keep number values', () => {
      const params = { page: 1, pageSize: 10, fields: [] }
      const result = normalizeParams(params)
      expect(result).toEqual({ page: 1, pageSize: 10 })
    })

    it('should keep boolean values', () => {
      const params = { active: true, fields: [] }
      const result = normalizeParams(params)
      expect(result).toEqual({ active: true })
    })

    it('should keep null values', () => {
      const params = { value: null, fields: [] }
      const result = normalizeParams(params)
      expect(result).toEqual({ value: null })
    })
  })

  describe('when params is empty object', () => {
    it('should return empty object', () => {
      const params = {}
      const result = normalizeParams(params)
      expect(result).toEqual({})
    })
  })

  describe('when params has no arrays', () => {
    it('should return params unchanged', () => {
      const params = { page: 1, ordering: 'name' }
      const result = normalizeParams(params)
      expect(result).toEqual({ page: 1, ordering: 'name' })
    })
  })
})
