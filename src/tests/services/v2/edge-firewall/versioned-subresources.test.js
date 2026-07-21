import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import {
  spyHttpRequest,
  stubVersionQueryCache,
  restoreBoundaries
} from '@/tests/support/versioning/boundaries'
import { VersionedFirewallFunctionService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-function-service'
import { VersionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

/**
 * Edge Firewall versioned sub-resources.
 *
 * BESPOKE: neither service is produced by `createVersionedSubResourceService` —
 * both are hand-written classes with resource-specific signatures (Function name
 * enrichment; Rules Engine phase paths + reorder). They cannot run the shared
 * factory-contract suite, so this file covers the CRUD gaps and — most
 * importantly — the version-scope ISOLATION invariant that the existing partial
 * test (`versioned-firewall-sub-resource-service.test.js`) does not assert.
 *
 * OVERLAP: the existing file covers Function {list, remove} and Rules Engine
 * {list, reorder, create, delete}. This file adds the missing {load, create,
 * edit} + isolation without duplicating those. Both files COEXIST (green);
 * consolidation deferred to F4.
 */

describe('versioned sub-resource CRUD (bespoke): edge-firewall / firewallFunction', () => {
  const RID_A = 'fw-A'
  const RID_B = 'fw-B'
  const VID_1 = 'AVFW1'
  const VID_2 = 'AVFW2'
  const FUNCTIONS_URL = (rid, vid, suffix = '') =>
    `v4/workspace/firewalls/${rid}/versions/${vid}/functions${suffix}`
  const allKey = (rid, vid) => queryKeys.firewall.version.functions.all(rid, vid)

  let svc

  beforeEach(() => {
    svc = new VersionedFirewallFunctionService()
  })

  afterEach(() => {
    restoreBoundaries()
  })

  it('load GETs the function by id and returns it via the adapter', async () => {
    stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 9, name: 'fn', function: 3 } })

    const result = await svc.load(RID_A, VID_1, 9)

    expect(http.spy).toHaveBeenCalledWith({
      method: 'GET',
      url: FUNCTIONS_URL(RID_A, VID_1, '/9')
    })
    expect(result.id).toBe(9)
  })

  it('create POSTs the mapped payload, invalidates (rid, vid) and returns { feedback, id }', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 7 } })

    const result = await svc.create(RID_A, VID_1, {
      name: 'fn',
      edgeFunctionID: 3,
      args: '{}',
      azionForm: '{}'
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'POST',
      url: FUNCTIONS_URL(RID_A, VID_1),
      body: expect.objectContaining({ name: 'fn', function: 3, active: true })
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: allKey(RID_A, VID_1) })
    expect(result).toEqual({ feedback: 'Your Function has been created', id: 7 })
  })

  it('edit PUTs the mapped payload to /{id} and invalidates (rid, vid)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await svc.edit(RID_A, VID_1, {
      id: 5,
      name: 'fn',
      edgeFunctionID: 3,
      args: '{}',
      azionForm: '{}'
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'PUT',
      url: FUNCTIONS_URL(RID_A, VID_1, '/5'),
      body: expect.objectContaining({ name: 'fn', function: 3 })
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: allKey(RID_A, VID_1) })
    expect(result).toBe('Function successfully updated')
  })

  it('scopes the invalidated cache key to exactly (A, v1) — never (A, v2) nor (B, v1)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 7 } })

    await svc.create(RID_A, VID_1, { name: 'fn', edgeFunctionID: 3, args: '{}', azionForm: '{}' })

    const scopedKey = allKey(RID_A, VID_1)
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: scopedKey })
    expect(scopedKey).not.toEqual(allKey(RID_A, VID_2))
    expect(scopedKey).not.toEqual(allKey(RID_B, VID_1))
  })
})

describe('versioned sub-resource CRUD (bespoke): edge-firewall / firewallRulesEngine', () => {
  const RID_A = 'fw-A'
  const RID_B = 'fw-B'
  const VID_1 = 'AVFW1'
  const VID_2 = 'AVFW2'
  const RULES_URL = (rid, vid, suffix = '') =>
    `v4/workspace/firewalls/${rid}/versions/${vid}/request_rules${suffix}`
  const allKey = (rid, vid) => queryKeys.firewall.version.rulesEngine.all(rid, vid)

  let svc

  beforeEach(() => {
    svc = new VersionedFirewallRulesEngineService()
  })

  afterEach(() => {
    restoreBoundaries()
  })

  it('load GETs the rule by id and returns it via the adapter', async () => {
    stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 9, name: 'rule', criteria: [], behaviors: [] } })

    const result = await svc.loadEdgeFirewallRulesEngineService({
      id: 9,
      edgeFirewallId: RID_A,
      versionId: VID_1
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'GET',
      url: RULES_URL(RID_A, VID_1, '/9')
    })
    expect(result.id).toBe(9)
  })

  it('edit PUTs the mapped payload to /{id} and invalidates (rid, vid)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await svc.editEdgeFirewallRulesEngineService(
      RID_A,
      { id: 5, name: 'rule', description: 'd', active: true, criteria: [], behaviors: [] },
      VID_1
    )

    expect(http.spy).toHaveBeenCalledWith({
      method: 'PUT',
      url: RULES_URL(RID_A, VID_1, '/5'),
      body: expect.objectContaining({ name: 'rule', active: true })
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: allKey(RID_A, VID_1) })
    expect(result).toBe('Rule Engine successfully updated')
  })

  it('scopes the invalidated cache key to exactly (A, v1) — never (A, v2) nor (B, v1)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({})

    await svc.createEdgeFirewallRulesEngineService(
      RID_A,
      { name: 'rule', description: 'd', active: true, criteria: [], behaviors: [] },
      VID_1
    )

    const scopedKey = allKey(RID_A, VID_1)
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: scopedKey })
    expect(scopedKey).not.toEqual(allKey(RID_A, VID_2))
    expect(scopedKey).not.toEqual(allKey(RID_B, VID_1))
  })
})
