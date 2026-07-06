import { describe, it, expect } from 'vitest'
import { buildSummary } from '@/helpers'

describe('buildSummary', () => {
  it('should transform the object into a sorted key-value array, excluding "ts"', () => {
    const httpResponse = {
      configurationId: '123',
      host: 'localhost',
      requestId: 'abc',
      requestUri: '/api/test',
      requestMethod: 'GET',
      status: '200',
      ts: '2024-02-21T12:00:00Z'
    }

    // Priority order (SUMMARY_FIELD_PRIORITY): requestUri/requestMethod/status
    // rank above requestId — requestUri is more important than httpReferer et al.
    const expectedOutput = [
      { key: 'configurationId', value: '123' },
      { key: 'host', value: 'localhost' },
      { key: 'requestUri', value: '/api/test' },
      { key: 'requestMethod', value: 'GET' },
      { key: 'status', value: '200' },
      { key: 'requestId', value: 'abc' }
    ]

    expect(buildSummary(httpResponse)).toEqual(expectedOutput)
  })

  it('should return an empty array if all keys are removed', () => {
    expect(buildSummary({ ts: '2024-02-21T12:00:00Z' })).toEqual([])
  })

  it('should handle an empty object', () => {
    expect(buildSummary({})).toEqual([])
  })

  // ── Task 15.2 (reproduce-first) ─────────────────────────────────────────────
  // The `shouldLimitRequestUri` flag USED to cut the stored value to the first
  // 50 chars + '...' at DATA level, so copy / add-filter / exclude-filter emitted
  // a value that diverged from the applied filter. The stored value must now be
  // the FULL requestUri regardless of the flag; visual shortening is CSS-only.
  describe('requestUri is never truncated at data level (task 15.2)', () => {
    const LONG_URI =
      '/api/v1/resources/very/deep/path/segment?query=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&page=2&extra=zzzzzzzzzz'

    it('keeps the full requestUri even when shouldLimitRequestUri is true', () => {
      const summary = buildSummary({ requestUri: LONG_URI }, true)
      const entry = summary.find((item) => item.key === 'requestUri')
      expect(entry.value).toBe(LONG_URI)
      expect(entry.value.endsWith('...')).toBe(false)
    })

    it('keeps the full requestUri when shouldLimitRequestUri is false', () => {
      const summary = buildSummary({ requestUri: LONG_URI }, false)
      const entry = summary.find((item) => item.key === 'requestUri')
      expect(entry.value).toBe(LONG_URI)
    })
  })

  it('should maintain correct sorting even with mixed types', () => {
    const httpResponse = {
      zeta: 'last',
      alpha: 'first',
      numeric: 123,
      boolean: true,
      ts: 'should be removed'
    }

    const expectedOutput = [
      { key: 'alpha', value: 'first' },
      { key: 'boolean', value: true },
      { key: 'numeric', value: 123 },
      { key: 'zeta', value: 'last' }
    ]

    expect(buildSummary(httpResponse)).toEqual(expectedOutput)
  })
})
