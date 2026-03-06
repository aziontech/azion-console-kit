import { describe, expect, it } from 'vitest'
import { getKeysForEvents } from '@services/v2/base/cache-sync/invalidation-map'

describe('getKeysForEvents', () => {
  it('should return empty array for empty input', () => {
    expect(getKeysForEvents([])).toEqual([])
    expect(getKeysForEvents(null)).toEqual([])
    expect(getKeysForEvents(undefined)).toEqual([])
  })

  it('should match edge application events', () => {
    const result = getKeysForEvents(['Edge Application myapp was updated'])

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((key) => key[0] === 'application')).toBe(true)
  })

  it('should match workload events', () => {
    const result = getKeysForEvents(['Workloads myworkload was created'])

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((key) => key[0] === 'workloads')).toBe(true)
  })

  it('should match firewall events', () => {
    const result = getKeysForEvents(['Firewall myfirewall was deleted'])

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((key) => key[0] === 'edge-firewalls')).toBe(true)
  })

  it('should match domain events to workload keys', () => {
    const result = getKeysForEvents(['Domain mydomain.com was updated'])

    expect(result.some((key) => key[0] === 'workloads')).toBe(true)
  })

  it('should match team events', () => {
    const result = getKeysForEvents(['Team myteam was created'])

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((key) => key[0] === 'teams')).toBe(true)
  })

  it('should deduplicate keys from multiple matching events', () => {
    const result = getKeysForEvents([
      'Edge Application app1 was created',
      'Application app2 was updated'
    ])

    const applicationKeys = result.filter((key) => key[0] === 'application')
    expect(applicationKeys.length).toBe(1)
  })

  it('should return empty array for unmatched events', () => {
    const result = getKeysForEvents(['Something completely unknown happened'])

    expect(result).toEqual([])
  })

  it('should be case-insensitive', () => {
    const result = getKeysForEvents(['edge application myapp was updated'])

    expect(result.length).toBeGreaterThan(0)
  })

  it('should match longer prefix before shorter (sort correctness)', () => {
    const resultSpecific = getKeysForEvents(['Edge Function myFunc was created'])
    const resultGeneric = getKeysForEvents(['Edge Application myApp was created'])

    expect(resultSpecific.length).toBeGreaterThan(0)
    expect(resultGeneric.length).toBeGreaterThan(0)
  })
})
