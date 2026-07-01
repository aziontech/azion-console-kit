import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EdgeFirewallRulesEngineService } from '@/services/v2/edge-firewall/edge-firewall-rules-engine-service'
import { versionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

const FIREWALL_ID = 'fw-123'
const VERSION_ID = 'version-456'

let service

beforeEach(() => {
  service = new EdgeFirewallRulesEngineService()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EdgeFirewallRulesEngineService - listWafDependenciesByVersion', () => {
  it('should request the raw request rules with the waf discovery fields', async () => {
    const listSpy = vi
      .spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(listSpy).toHaveBeenCalledWith({
      firewallId: FIREWALL_ID,
      versionId: VERSION_ID,
      fields: ['id', 'name', 'behaviors']
    })
  })

  it('should extract the waf id from a raw set_waf behavior using attributes.waf_id', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, behaviors: [{ type: 'set_waf', attributes: { waf_id: 10, mode: 'blocking' } }] }
      ]
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ wafId: 10, ruleCount: 1 }])
  })

  it('should handle the parsed behavior shape using name and id', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, behaviors: [{ name: 'set_waf', id: 7, mode: 'counting' }] },
        { id: 2, behaviors: [{ name: 'set_waf', id: 7, mode: 'counting' }] }
      ]
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ wafId: 7, ruleCount: 2 }])
  })

  it('should dedupe the same waf referenced by multiple rules and count distinct ids', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, behaviors: [{ type: 'set_waf', attributes: { waf_id: 10 } }] },
        { id: 2, behaviors: [{ type: 'set_waf', attributes: { waf_id: 10 } }] },
        { id: 3, behaviors: [{ type: 'set_waf', attributes: { waf_id: 20 } }] }
      ]
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { wafId: 10, ruleCount: 2 },
      { wafId: 20, ruleCount: 1 }
    ])
  })

  it('should ignore non set_waf behaviors and rules without behaviors', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, behaviors: [{ type: 'run_function', attributes: { value: 99 } }] },
        {
          id: 2,
          behaviors: [
            { type: 'set_rate_limit', attributes: {} },
            { type: 'set_waf', attributes: { waf_id: 10 } }
          ]
        },
        { id: 3, behaviors: [] },
        { id: 4 }
      ]
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ wafId: 10, ruleCount: 1 }])
  })

  it('should skip set_waf behaviors whose waf id is null or undefined', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, behaviors: [{ type: 'set_waf', attributes: { waf_id: null } }] },
        { id: 2, behaviors: [{ type: 'set_waf', attributes: {} }] },
        { id: 3, behaviors: [{ type: 'set_waf' }] },
        { id: 4, behaviors: [{ type: 'set_waf', attributes: { waf_id: 10 } }] }
      ]
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ wafId: 10, ruleCount: 1 }])
  })

  it('should return an empty array when there are no rules', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: []
    })

    const result = await service.listWafDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([])
  })
})

describe('EdgeFirewallRulesEngineService - listNetworkListDependenciesByVersion', () => {
  it('should request the raw request rules with the network list discovery fields', async () => {
    const listSpy = vi
      .spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw')
      .mockResolvedValueOnce({ body: [], count: 0 })

    await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(listSpy).toHaveBeenCalledWith({
      firewallId: FIREWALL_ID,
      versionId: VERSION_ID,
      fields: ['id', 'name', 'criteria']
    })
  })

  it('should extract the network list id from a ${network} criterion argument (grouped criteria)', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          criteria: [[{ variable: '${network}', operator: 'is_in_list', argument: 30 }]]
        }
      ]
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ networkListId: 30, ruleCount: 1 }])
  })

  it('should dedupe the same network list across rules and count distinct ids', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, criteria: [[{ variable: '${network}', argument: 30 }]] },
        { id: 2, criteria: [[{ variable: '${network}', argument: 30 }]] },
        { id: 3, criteria: [[{ variable: '${network}', argument: 40 }]] }
      ]
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([
      { networkListId: 30, ruleCount: 2 },
      { networkListId: 40, ruleCount: 1 }
    ])
  })

  it('should ignore criteria variables that are not ${network}', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        {
          id: 1,
          criteria: [
            [
              { variable: '${uri}', operator: 'starts_with', argument: '/api' },
              { variable: '${network}', operator: 'is_in_list', argument: 30 }
            ]
          ]
        },
        { id: 2, criteria: [[{ variable: '${scheme}', argument: 'https' }]] }
      ]
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ networkListId: 30, ruleCount: 1 }])
  })

  it('should tolerate a flat (non-grouped) criteria array', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [{ id: 1, criteria: [{ variable: '${network}', argument: 50 }] }]
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ networkListId: 50, ruleCount: 1 }])
  })

  it('should skip ${network} criteria whose argument is null, undefined or empty', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: [
        { id: 1, criteria: [[{ variable: '${network}', argument: null }]] },
        { id: 2, criteria: [[{ variable: '${network}', argument: '' }]] },
        { id: 3, criteria: [[{ variable: '${network}' }]] },
        { id: 4, criteria: [[{ variable: '${network}', argument: 30 }]] }
      ]
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([{ networkListId: 30, ruleCount: 1 }])
  })

  it('should return an empty array when there are no rules', async () => {
    vi.spyOn(versionedFirewallRulesEngineService, 'listRequestRulesRaw').mockResolvedValueOnce({
      body: []
    })

    const result = await service.listNetworkListDependenciesByVersion(FIREWALL_ID, VERSION_ID)

    expect(result).toEqual([])
  })
})
