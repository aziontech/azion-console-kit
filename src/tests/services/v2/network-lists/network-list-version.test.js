/**
 * Coverage-matrix claims (spec versioning-test-coverage / TEST-ARCHITECTURE §3.4).
 * The matrix (tests/coverage-matrix.json) is DERIVED from these markers —
 * run `node scripts/check-coverage-matrix.mjs --write` after changing them.
 * @covers network_list:J1 component partial
 * @covers network_list:J2 component
 * @covers network_list:J3 component partial
 * @covers network_list:J4 component
 * @covers network_list:J6 component
 * @covers network_list:J7 component
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { RESOURCE_TEST_REGISTRY } from '@/tests/support/versioning/registry'
import { describeVersionServiceContract } from '@/tests/shared/versioning/version-service.contract'
import { describeVersionAdapterContract } from '@/tests/shared/versioning/version-adapter.contract'
import {
  spyHttpRequest,
  stubVersionQueryCache,
  restoreBoundaries
} from '@/tests/support/versioning/boundaries'
import { NetworkListVersionService } from '@/services/v2/network-lists/network-list-version-service'

const networkList = RESOURCE_TEST_REGISTRY.network_list
const adapter = networkList.adapter

describeVersionServiceContract(networkList)
describeVersionAdapterContract(networkList)

const versionMeta = (snapshot) => ({
  version_id: 'AVNL0001',
  version: 3,
  state: 'draft',
  created_at: '2026-06-18T10:00:00Z',
  last_modified: '2026-06-18T10:00:00Z',
  last_editor: 'user@azion.com',
  ...snapshot
})

describe('network_list — bespoke: per-type item extraction', () => {
  it('joins ASN items by newline into itemsValues', () => {
    const result = adapter.transformLoadVersion(
      versionMeta({ id: 702, name: 'asn-list', type: 'asn', items: ['16509', '13335'] })
    )

    expect(result.config).toMatchObject({ id: 702, name: 'asn-list', networkListType: 'asn' })
    expect(result.config.itemsValues).toBe('16509\n13335')
  })

  it('keeps Countries items as an array (itemsValuesCountry) and empties itemsValues', () => {
    const result = adapter.transformLoadVersion(
      versionMeta({ id: 703, name: 'countries-list', type: 'countries', items: ['BR', 'US'] })
    )

    expect(result.config).toMatchObject({
      id: 703,
      name: 'countries-list',
      networkListType: 'countries'
    })
    expect(result.config.itemsValuesCountry).toEqual(['BR', 'US'])
    expect(result.config.itemsValues).toBe('')
  })

  it('maps a Countries form back to the root items array on a PUT', () => {
    const form = adapter.transformLoadVersion(
      versionMeta({ id: 703, name: 'countries-list', type: 'countries', items: ['BR', 'US'] })
    ).config
    const payload = adapter.transformDraftPayload(form)

    expect(payload).toMatchObject({ name: 'countries-list', type: 'countries' })
    expect(payload.items).toEqual(['BR', 'US'])
  })
})

describe('network_list — bespoke: a global list stays scoped per resource id', () => {
  const RID = 'nl-123'
  const GLOBAL_ID = 'global-77'
  const VID = 'AVNL0001'
  let service

  beforeEach(() => {
    service = new NetworkListVersionService()
  })

  afterEach(() => {
    restoreBoundaries()
  })

  it('builds a resource-scoped URL for the global list id', () => {
    expect(service.getUrl(GLOBAL_ID, VID)).toBe(
      `v4/workspace/network_lists/${GLOBAL_ID}/versions/${VID}`
    )
  })

  it('invalidation of the global list never touches another resource id', async () => {
    const cache = stubVersionQueryCache(service)
    const http = spyHttpRequest()
    http.respondWith({})

    await service.deleteVersion(GLOBAL_ID, VID)

    const globalKey = queryKeys.networkList.version.all(GLOBAL_ID)
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: globalKey })
    expect(globalKey).not.toEqual(queryKeys.networkList.version.all(RID))
  })
})
