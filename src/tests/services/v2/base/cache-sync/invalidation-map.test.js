import { describe, expect, it } from 'vitest'
import {
  getKeysForEvents,
  getKeysForResource,
  getParentKeys,
  PARENT_TYPE_TO_QUERY_KEY
} from '@services/v2/base/cache-sync/invalidation-map'

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
})

describe('getKeysForResource', () => {
  it('should return empty array when resourceType is missing', () => {
    expect(getKeysForResource(null, 'created', 123)).toEqual([])
    expect(getKeysForResource(undefined, 'created', 123)).toEqual([])
    expect(getKeysForResource('', 'created', 123)).toEqual([])
  })

  it('should return empty array when activityType is missing', () => {
    expect(getKeysForResource('application', null, 123)).toEqual([])
    expect(getKeysForResource('application', undefined, 123)).toEqual([])
    expect(getKeysForResource('application', '', 123)).toEqual([])
  })

  it('should return empty array for unknown resource type', () => {
    expect(getKeysForResource('unknown_type', 'created', 123)).toEqual([])
  })

  it('should return collection keys for application', () => {
    const result = getKeysForResource('application', 'created', null)

    expect(result.length).toBeGreaterThan(0)
    expect(result.some((key) => key[0] === 'application')).toBe(true)
  })

  it('should return targeted keys when resourceId is provided for application', () => {
    const result = getKeysForResource('application', 'edited', 12345)

    expect(result.length).toBe(2)
    expect(result.some((key) => key[0] === 'application')).toBe(true)
    expect(result.some((key) => key[0] === 'application' && key[1] === 12345)).toBe(true)
  })

  it('should return collection and detail keys for firewall with resourceId', () => {
    const result = getKeysForResource('firewall', 'deleted', 999)

    expect(result.length).toBe(2)
    expect(result.some((key) => key[0] === 'edge-firewalls')).toBe(true)
    expect(
      result.some((key) => key[0] === 'edge-firewalls' && key[1] === 'detail' && key[2] === 999)
    ).toBe(true)
  })

  it('should return collection keys for workload', () => {
    const result = getKeysForResource('workload', 'created', null)

    expect(result.some((key) => key[0] === 'workloads')).toBe(true)
  })

  it('should return targeted keys for workload with resourceId', () => {
    const result = getKeysForResource('workload', 'edited', 42)

    expect(result.length).toBe(2)
    expect(
      result.some((key) => key[0] === 'workloads' && key[1] === 'detail' && key[2] === 42)
    ).toBe(true)
  })

  it('should return keys for domain resource type', () => {
    const result = getKeysForResource('domain', 'created', null)

    expect(result.some((key) => key[0] === 'workloads')).toBe(true)
  })

  it('should return keys for team resource type', () => {
    const result = getKeysForResource('team', 'created', null)

    expect(result.some((key) => key[0] === 'teams')).toBe(true)
  })

  it('should return both application and firewall keys for function', () => {
    const result = getKeysForResource('function', 'created', null)

    expect(result.some((key) => key[0] === 'application')).toBe(true)
    expect(result.some((key) => key[0] === 'edge-functions')).toBe(true)
  })
})

describe('getParentKeys', () => {
  describe('valid parent ID', () => {
    it('should return detail key for Application parent', () => {
      const result = getParentKeys('Application', '1772656941')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', '1772656941'])
    })

    it('should return detail key for Edge Firewall parent', () => {
      const result = getParentKeys('Edge Firewall', '12345')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['edge-firewalls', 'detail', '12345'])
    })

    it('should return detail key for Workload parent', () => {
      const result = getParentKeys('Workload', '42')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['workloads', 'detail', '42'])
    })

    it('should return detail key for Edge DNS parent', () => {
      const result = getParentKeys('Edge DNS', '999')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['edge-dns', 'detail', '999'])
    })

    it('should return detail key for Data Stream parent', () => {
      const result = getParentKeys('Data Stream', '555')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['data-streams', 'detail', '555'])
    })

    it('should return detail key for Edge Function parent', () => {
      const result = getParentKeys('Edge Function', '789')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['edge-functions', 'detail', '789'])
    })

    it('should accept numeric parent ID', () => {
      const result = getParentKeys('Application', 12345)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', 12345])
    })
  })

  describe('parent ID handling', () => {
    it('should return detail key with empty string parent ID', () => {
      const result = getParentKeys('Application', '')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', ''])
    })

    it('should return detail key with hyphen parent ID', () => {
      const result = getParentKeys('Application', '-')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', '-'])
    })

    it('should return detail key with hyphen with spaces parent ID', () => {
      const result = getParentKeys('Application', ' - ')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', ' - '])
    })

    it('should return detail key with null parent ID', () => {
      const result = getParentKeys('Application', null)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', null])
    })

    it('should return detail key with undefined parent ID', () => {
      const result = getParentKeys('Application', undefined)

      expect(result.length).toBe(1)
      expect(result[0]).toEqual(['application', undefined])
    })
  })

  describe('unknown parent type', () => {
    it('should return empty array for unknown parent type', () => {
      const result = getParentKeys('Unknown Type', '123')

      expect(result).toEqual([])
    })

    it('should return empty array for null parent type', () => {
      const result = getParentKeys(null, '123')

      expect(result).toEqual([])
    })

    it('should return empty array for undefined parent type', () => {
      const result = getParentKeys(undefined, '123')

      expect(result).toEqual([])
    })
  })

  describe('all mapped parent types', () => {
    it('should have all PARENT_TYPE_TO_QUERY_KEY entries mapped to valid queryKeys', () => {
      const mappedTypes = Object.keys(PARENT_TYPE_TO_QUERY_KEY)

      expect(mappedTypes.length).toBeGreaterThan(0)

      // Verify each mapping returns a valid key
      for (const parentType of mappedTypes) {
        const result = getParentKeys(parentType, 'test-id')
        expect(result.length).toBeGreaterThan(0)
      }
    })
  })
})
