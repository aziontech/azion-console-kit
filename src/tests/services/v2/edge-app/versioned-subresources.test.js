import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import {
  spyHttpRequest,
  stubVersionQueryCache,
  restoreBoundaries
} from '@/tests/support/versioning/boundaries'
import { describeVersionedSubresourceCrud } from '@/tests/shared/versioning/subresource-crud.contract'

import { versionedCacheSettingsService } from '@/services/v2/edge-app/versioned/versioned-cache-settings-service'
import { versionedDeviceGroupService } from '@/services/v2/edge-app/versioned/versioned-device-group-service'
import { versionedFunctionService } from '@/services/v2/edge-app/versioned/versioned-function-service'
import { versionedRulesEngineService } from '@/services/v2/edge-app/versioned/versioned-rules-engine-service'

/**
 * Edge Application versioned sub-resources.
 *
 * `cacheSettings`, `deviceGroups` and `functions` are produced by
 * `createVersionedSubResourceService`, so they run the shared factory-contract
 * suite. `rulesEngine` has its own (request/response phase) signature — it does
 * not fit the generic drop-in interface — so it is covered bespoke below.
 *
 * TODO (F4): move these sub-resource descriptors (path/idKey/queryKeyGroup/
 * buildPayload) into `RESOURCE_TEST_REGISTRY[...].subresources` so the suite is
 * driven entirely from the registry. They live here for now because the registry
 * subresource entries only carry `{ key, service }` on this branch.
 */

describeVersionedSubresourceCrud({
  ownerLabel: 'edge-app',
  subKey: 'cacheSettings',
  service: () => versionedCacheSettingsService,
  path: 'cache_settings',
  queryKeyGroup: queryKeys.application.version.cacheSettings,
  idKey: 'cacheId',
  buildPayload: () => ({
    name: 'cs-1',
    browserCacheSettings: 'honor',
    cdnCacheSettings: 'honor',
    cacheByQueryString: 'ignore',
    cacheByCookies: 'ignore',
    adaptiveDeliveryAction: 'ignore'
  })
})

describeVersionedSubresourceCrud({
  ownerLabel: 'edge-app',
  subKey: 'deviceGroups',
  service: () => versionedDeviceGroupService,
  path: 'device_groups',
  queryKeyGroup: queryKeys.application.version.deviceGroups,
  buildPayload: () => ({ name: 'dg-1', userAgent: 'Mozilla/5.0' })
})

describeVersionedSubresourceCrud({
  ownerLabel: 'edge-app',
  subKey: 'functions',
  service: () => versionedFunctionService,
  path: 'functions',
  queryKeyGroup: queryKeys.application.version.functions,
  buildPayload: () => ({ name: 'fn-1', edgeFunctionID: 3, args: '{}', azionForm: '{}' })
})

/**
 * Bespoke — Rules Engine carries a phase-aware API (`request_rules` /
 * `response_rules`) and object-shaped arguments, so it diverges from the generic
 * factory interface. The inherited version-scoping guarantee still holds and is
 * proven here directly.
 */
describe('versioned sub-resource CRUD (bespoke): edge-app / rulesEngine', () => {
  const RID_A = 'app-A'
  const RID_B = 'app-B'
  const VID_1 = 'AV1'
  const VID_2 = 'AV2'
  const CREATED_ID = 7
  const REQUEST_URL = (rid, vid, suffix = '') =>
    `v4/workspace/applications/${rid}/versions/${vid}/request_rules${suffix}`

  let svc

  beforeEach(() => {
    svc = versionedRulesEngineService
  })

  afterEach(() => {
    restoreBoundaries()
  })

  it('createRulesEngine POSTs the mapped rule to request_rules, invalidates (rid, vid) and returns { feedback, id }', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: CREATED_ID } })

    const result = await svc.createRulesEngine({
      edgeApplicationId: RID_A,
      versionId: VID_1,
      phase: 'request',
      name: 'r',
      isActive: true,
      behaviors: [],
      criteria: [],
      description: 'd'
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'POST',
      url: REQUEST_URL(RID_A, VID_1),
      body: expect.objectContaining({ name: 'r', phase: 'request', active: true })
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.application.version.rulesEngine.all(RID_A, VID_1)
    })
    expect(result).toEqual({ feedback: 'Rule successfully created', id: CREATED_ID })
  })

  it('loadRulesEngine GETs the rule by id under the phase path', async () => {
    const http = spyHttpRequest()
    http.respondWith({ data: { id: 9, behaviors: [] } })

    const result = await svc.loadRulesEngine({
      edgeApplicationId: RID_A,
      versionId: VID_1,
      id: 9,
      phase: 'request'
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'GET',
      url: REQUEST_URL(RID_A, VID_1, '/9')
    })
    expect(result.id).toBe(9)
  })

  it('editRulesEngine PATCHes the rule by id and invalidates (rid, vid)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await svc.editRulesEngine({
      edgeApplicationId: RID_A,
      versionId: VID_1,
      payload: {
        id: 5,
        phase: 'request',
        name: 'r',
        behaviors: [],
        criteria: [],
        isActive: true,
        description: 'd'
      }
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: REQUEST_URL(RID_A, VID_1, '/5'),
      body: expect.objectContaining({ name: 'r', active: true })
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.application.version.rulesEngine.all(RID_A, VID_1)
    })
    expect(result).toBe('Rule successfully updated')
  })

  it('deleteRulesEngine DELETEs the rule by id and invalidates (rid, vid)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({})

    const result = await svc.deleteRulesEngine({
      edgeApplicationId: RID_A,
      versionId: VID_1,
      ruleId: 77,
      phase: 'request'
    })

    expect(http.spy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: REQUEST_URL(RID_A, VID_1, '/77')
    })
    expect(cache.removeQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.application.version.rulesEngine.all(RID_A, VID_1)
    })
    expect(result).toBe('Rule successfully deleted')
  })

  it('scopes the invalidated cache key to exactly (A, v1) — never (A, v2) nor (B, v1)', async () => {
    const cache = stubVersionQueryCache(svc)
    const http = spyHttpRequest()
    http.respondWith({ data: { id: CREATED_ID } })

    await svc.createRulesEngine({
      edgeApplicationId: RID_A,
      versionId: VID_1,
      phase: 'request',
      name: 'r',
      isActive: true,
      behaviors: [],
      criteria: [],
      description: 'd'
    })

    const scopedKey = queryKeys.application.version.rulesEngine.all(RID_A, VID_1)
    expect(cache.removeQueries).toHaveBeenCalledWith({ queryKey: scopedKey })
    expect(scopedKey).not.toEqual(queryKeys.application.version.rulesEngine.all(RID_A, VID_2))
    expect(scopedKey).not.toEqual(queryKeys.application.version.rulesEngine.all(RID_B, VID_1))
  })
})
