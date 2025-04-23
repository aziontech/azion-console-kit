import { describe, expect, it, beforeEach } from 'vitest'
import { setWithExpiration, getWithExpiration } from '../../../src/helpers/local-storage-manager'

describe('local-storage-manager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('setWithExpiration', () => {
    it('should set a value in localStorage with expiration time', () => {
      const key = 'test-key'
      const value = { test: 'value' }
      const expirationMinutes = 30

      setWithExpiration({ key, value, expirationMinutes })

      const storedData = localStorage.getItem(key)
      expect(storedData).toBeDefined()

      const decryptedData = JSON.parse(atob(storedData))
      expect(decryptedData.value).toEqual(value)
      expect(decryptedData.expiresAt).toBeGreaterThan(Date.now())
    })

    it('should use default expiration time when not provided', () => {
      const key = 'test-key'
      const value = { test: 'value' }
      const now = Date.now()

      setWithExpiration({ key, value })

      const storedData = localStorage.getItem(key)
      const decryptedData = JSON.parse(atob(storedData))
      const expectedExpiration = now + 60 * 60000 // 60 minutes in milliseconds

      expect(decryptedData.expiresAt).toBeGreaterThan(now)
      expect(decryptedData.expiresAt).toBeLessThanOrEqual(expectedExpiration)
    })

    it('should not set value when key is not provided', () => {
      const value = { test: 'value' }

      setWithExpiration({ key: null, value })

      expect(localStorage.length).toBe(0)
    })
  })

  describe('getWithExpiration', () => {
    it('should return stored value when not expired', () => {
      const key = 'test-key'
      const value = { test: 'value' }
      const expirationMinutes = 30

      setWithExpiration({ key, value, expirationMinutes })
      const result = getWithExpiration(key)

      expect(result).toEqual(value)
    })

    it('should return null when value is expired', () => {
      const key = 'test-key'
      const value = { test: 'value' }
      const expirationMinutes = -1 // Set to expire immediately

      setWithExpiration({ key, value, expirationMinutes })
      const result = getWithExpiration(key)

      expect(result).toBeNull()
      expect(localStorage.getItem(key)).toBeNull()
    })

    it('should return null when key does not exist', () => {
      const result = getWithExpiration('non-existent-key')
      expect(result).toBeNull()
    })

    it('should return null when key is not provided', () => {
      const result = getWithExpiration(null)
      expect(result).toBeNull()
    })

    it('should return null when stored data is corrupted', () => {
      const key = 'test-key'
      localStorage.setItem(key, 'invalid-base64-data')

      const result = getWithExpiration(key)
      expect(result).toBeNull()
    })
  })
})
