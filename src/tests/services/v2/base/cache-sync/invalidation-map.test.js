// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  getParentKeys,
  getKeysForResource,
  getKeysForEvents
} from '@/services/v2/base/cache-sync/invalidation-map'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

/**
 * invalidation-map — resolves which TanStack caches an SSE activity event
 * touches (test-maturity deep pass). Pure resolution logic, asserted against
 * the REAL queryKeys registry (no hardcoded key literals).
 */
describe('getKeysForResource — structured events', () => {
  it('detail-mapped resource with id invalidates the collection AND the detail', () => {
    const keys = getKeysForResource('application', 'edited', 42)

    expect(keys).toEqual([queryKeys.application.all, queryKeys.application.detail(42)])
  })

  it('without a resource id only the collection is invalidated', () => {
    const keys = getKeysForResource('application', 'created', null)

    expect(keys).toEqual([queryKeys.application.all])
  })

  it('simple-mapped resource never targets a detail', () => {
    const keys = getKeysForResource('billing', 'edited', 7)

    expect(keys).toEqual([queryKeys.billing.all])
  })

  it('unknown resource type or missing activity resolve to nothing', () => {
    expect(getKeysForResource('martian_resource', 'edited', 1)).toEqual([])
    expect(getKeysForResource('application', null, 1)).toEqual([])
  })
})

describe('getParentKeys — sub-resource events target the parent cache', () => {
  it('resolves the parent detail key when the query key supports it', () => {
    expect(getParentKeys('application', 9)).toEqual([queryKeys.application.detail(9)])
    expect(getParentKeys('domain', 5)).toEqual([queryKeys.workload.detail(5)])
  })

  it('resolves nested query-key paths (account credential → edgeStorage.credentials)', () => {
    const keys = getParentKeys('account credential', null)

    expect(keys.length).toBe(1)
  })

  it('PINNED (bug fix): "network list" parents resolve — the map key must be lowercase', () => {
    // CacheInvalidator lowercases parent.type; the entry was 'network List' and
    // never matched, so network-list parent events invalidated NOTHING.
    expect(getParentKeys('network list', 3)).toEqual([queryKeys.networkLists.detail(3)])
  })

  it('unknown parent type resolves to nothing', () => {
    expect(getParentKeys('martian parent', 1)).toEqual([])
  })
})

describe('getKeysForEvents — title-prefix fallback', () => {
  it('matches an event title by prefix', () => {
    const keys = getKeysForEvents(['Edge Application myapp was updated'])

    expect(keys).toEqual([queryKeys.application.all])
  })

  it('multi-resource prefixes fan out to every affected cache', () => {
    const keys = getKeysForEvents(['Function my-fn was deleted'])

    expect(keys).toEqual([
      queryKeys.edgeFunction.all,
      queryKeys.application.all,
      queryKeys.firewall.all
    ])
  })

  it('deduplicates keys across titles hitting the same cache', () => {
    const keys = getKeysForEvents([
      'Application app-a was updated',
      'CacheSetting cs-1 was updated'
    ])

    expect(keys).toEqual([queryKeys.application.all])
  })

  it('empty, null or unmatched titles resolve to nothing', () => {
    expect(getKeysForEvents([])).toEqual([])
    expect(getKeysForEvents([null, 'Something unrelated happened'])).toEqual([])
    expect(getKeysForEvents('not-an-array')).toEqual([])
  })
})
