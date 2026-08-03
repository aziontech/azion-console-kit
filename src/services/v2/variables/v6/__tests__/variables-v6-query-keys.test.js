import { describe, it, expect } from 'vitest'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

describe('Property P4 — variables v6 cache keys are isolated from the legacy namespace', () => {
  const generatedKeys = [
    queryKeys.variablesV6.list({ page: 1 }),
    queryKeys.variablesV6.detail('abc'),
    queryKeys.variablesV6.versions.all('abc'),
    queryKeys.variablesV6.versions.list('abc', { page: 2 })
  ]

  it('exposes the exact v6 root namespace', () => {
    expect(queryKeys.variablesV6.all).toEqual(['variables-v6'])
  })

  it('prefixes every generated key with the v6 root namespace', () => {
    for (const key of generatedKeys) {
      expect(key[0]).toBe('variables-v6')
    }
  })

  it('never prefixes a v6 key with the legacy variables namespace', () => {
    for (const key of generatedKeys) {
      expect(key[0]).not.toBe(queryKeys.variables.all[0])
    }
  })

  it('includes the variable id in the versions list key', () => {
    const key = queryKeys.variablesV6.versions.list('abc', { page: 2 })

    expect(key).toContain('abc')
  })

  it('differentiates versions list keys by distinct params', () => {
    const keyPageTwo = queryKeys.variablesV6.versions.list('abc', { page: 2 })
    const keyPageThree = queryKeys.variablesV6.versions.list('abc', { page: 3 })

    expect(keyPageTwo).not.toEqual(keyPageThree)
  })
})
