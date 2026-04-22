import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  captureFirstSessionUrl,
  getFirstSessionUrl,
  clearFirstSessionUrl
} from '@/helpers/first-session-url'

const FIRST_SESSION_URL_KEY = 'azion_first_session_url'

describe('first-session-url', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('captureFirstSessionUrl', () => {
    it('should capture and store the current URL on first call', () => {
      const testUrl = 'https://console.azion.com/signup?ref=docs'
      vi.stubGlobal('location', { href: testUrl })

      const result = captureFirstSessionUrl()

      expect(result).toBe(testUrl)
      expect(localStorage.getItem(FIRST_SESSION_URL_KEY)).toBe(testUrl)
    })

    it('should return existing URL on subsequent calls without overwriting', () => {
      const firstUrl = 'https://console.azion.com/first-visit'
      const secondUrl = 'https://console.azion.com/different-page'

      // First capture
      vi.stubGlobal('location', { href: firstUrl })
      captureFirstSessionUrl()

      // Second capture attempt with different URL
      vi.stubGlobal('location', { href: secondUrl })
      const result = captureFirstSessionUrl()

      // Should return the first URL, not overwrite
      expect(result).toBe(firstUrl)
      expect(localStorage.getItem(FIRST_SESSION_URL_KEY)).toBe(firstUrl)
    })

    it('should return existing URL when called multiple times', () => {
      const testUrl = 'https://console.azion.com/signup?utm_source=google'
      vi.stubGlobal('location', { href: testUrl })

      // Call multiple times
      const result1 = captureFirstSessionUrl()
      const result2 = captureFirstSessionUrl()
      const result3 = captureFirstSessionUrl()

      expect(result1).toBe(testUrl)
      expect(result2).toBe(testUrl)
      expect(result3).toBe(testUrl)
      expect(localStorage.getItem(FIRST_SESSION_URL_KEY)).toBe(testUrl)
    })
  })

  describe('getFirstSessionUrl', () => {
    it('should return the stored first session URL', () => {
      const testUrl = 'https://console.azion.com/signup'
      localStorage.setItem(FIRST_SESSION_URL_KEY, testUrl)

      const result = getFirstSessionUrl()

      expect(result).toBe(testUrl)
    })

    it('should return null when no URL has been stored', () => {
      const result = getFirstSessionUrl()

      expect(result).toBeNull()
    })

    it('should not modify localStorage when retrieving', () => {
      const testUrl = 'https://console.azion.com/signup'
      localStorage.setItem(FIRST_SESSION_URL_KEY, testUrl)

      getFirstSessionUrl()
      getFirstSessionUrl()
      getFirstSessionUrl()

      expect(localStorage.getItem(FIRST_SESSION_URL_KEY)).toBe(testUrl)
    })
  })

  describe('clearFirstSessionUrl', () => {
    it('should remove the stored first session URL', () => {
      const testUrl = 'https://console.azion.com/signup'
      localStorage.setItem(FIRST_SESSION_URL_KEY, testUrl)

      clearFirstSessionUrl()

      expect(localStorage.getItem(FIRST_SESSION_URL_KEY)).toBeNull()
    })

    it('should not throw when no URL is stored', () => {
      expect(() => clearFirstSessionUrl()).not.toThrow()
    })

    it('should allow capturing new URL after clearing', () => {
      const firstUrl = 'https://console.azion.com/first'
      const secondUrl = 'https://console.azion.com/second'

      // Capture first URL
      vi.stubGlobal('location', { href: firstUrl })
      captureFirstSessionUrl()
      expect(getFirstSessionUrl()).toBe(firstUrl)

      // Clear
      clearFirstSessionUrl()
      expect(getFirstSessionUrl()).toBeNull()

      // Capture new URL
      vi.stubGlobal('location', { href: secondUrl })
      captureFirstSessionUrl()
      expect(getFirstSessionUrl()).toBe(secondUrl)
    })
  })

  describe('integration flow', () => {
    it('should handle full capture -> retrieve -> clear flow', () => {
      const testUrl = 'https://console.azion.com/signup?utm_source=docs'

      // Capture
      vi.stubGlobal('location', { href: testUrl })
      captureFirstSessionUrl()

      // Retrieve
      expect(getFirstSessionUrl()).toBe(testUrl)

      // Clear
      clearFirstSessionUrl()

      // Verify cleared
      expect(getFirstSessionUrl()).toBeNull()
    })

    it('should persist URL across multiple getFirstSessionUrl calls', () => {
      const testUrl = 'https://console.azion.com/signup?ref=email'

      vi.stubGlobal('location', { href: testUrl })
      captureFirstSessionUrl()

      // Multiple retrievals should return same value
      expect(getFirstSessionUrl()).toBe(testUrl)
      expect(getFirstSessionUrl()).toBe(testUrl)
      expect(getFirstSessionUrl()).toBe(testUrl)
    })
  })
})
