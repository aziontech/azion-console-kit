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

    const expectedOutput = [
      { key: 'configurationId', value: '123' },
      { key: 'host', value: 'localhost' },
      { key: 'requestId', value: 'abc' },
      { key: 'requestMethod', value: 'GET' },
      { key: 'requestUri', value: '/api/test' },
      { key: 'status', value: '200' }
    ]

    expect(buildSummary(httpResponse)).toEqual(expectedOutput)
  })

  it('should return an empty array if all keys are removed', () => {
    expect(buildSummary({ ts: '2024-02-21T12:00:00Z' })).toEqual([])
  })

  it('should handle an empty object', () => {
    expect(buildSummary({})).toEqual([])
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
