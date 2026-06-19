import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpService } from '@/services/v2/base/http/httpService'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { VersionedFirewallFunctionService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-function-service'
import { VersionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

const RID = 'fw-1'
const VID = 'AVFW0001'

const stubEnsure = (service) =>
  vi.spyOn(service, 'useEnsureQueryData').mockImplementation((_key, queryFn) => queryFn())

afterEach(() => {
  vi.restoreAllMocks()
})

describe('VersionedFirewallFunctionService', () => {
  let service

  beforeEach(() => {
    service = new VersionedFirewallFunctionService()
  })

  it('list GETs the versioned functions URL and returns { count, body }', async () => {
    stubEnsure(service)
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 1, results: [{ id: 1, name: 'fn', function: 9, last_modified: null }] }
    })

    const result = await service.list(RID, VID, { page: 1 })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/functions`,
      params: { page: 1 }
    })
    expect(result.count).toBe(1)
    expect(result.body[0].name).toBe('fn')
  })

  it('remove DELETEs by id and invalidates the versioned functions cache', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.remove(RID, VID, 55)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/functions/55`
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.firewall.version.functions.all(RID, VID)
    })
  })
})

describe('VersionedFirewallRulesEngineService', () => {
  let service

  beforeEach(() => {
    service = new VersionedFirewallRulesEngineService()
  })

  it('list GETs request_rules paginated and returns { count, body }', async () => {
    stubEnsure(service)
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({
      data: { count: 1, results: [{ id: 1, name: 'rule', active: true, last_modified: null }] }
    })

    const result = await service.listEdgeFirewallRulesEngineService({ id: RID, versionId: VID })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/request_rules`,
      params: { fields: [], ordering: '', page: 1, pageSize: 100, search: '' }
    })
    expect(result.count).toBe(1)
    expect(result.body[0].name).toBe('rule')
  })

  it('reorder PUTs to /request_rules/order and invalidates', async () => {
    const removeSpy = vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.reorderEdgeFirewallRulesEngineService([{ id: 2 }, { id: 1 }], RID, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PUT',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/request_rules/order`,
      body: { order: [2, 1] }
    })
    expect(removeSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.firewall.version.rulesEngine.all(RID, VID)
    })
  })

  it('create POSTs the mapped rule payload to request_rules', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.createEdgeFirewallRulesEngineService(
      RID,
      { name: 'r', description: 'd', active: true, criteria: [], behaviors: [] },
      VID
    )

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/request_rules`,
      body: expect.objectContaining({ name: 'r', description: 'd', active: true })
    })
  })

  it('delete DELETEs the rule by id', async () => {
    vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
    const requestSpy = vi.spyOn(httpService, 'request').mockResolvedValueOnce({ data: {} })

    await service.deleteEdgeFirewallRulesEngineService(RID, 77, VID)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/workspace/firewalls/${RID}/versions/${VID}/request_rules/77`
    })
  })
})
