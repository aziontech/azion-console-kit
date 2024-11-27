import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFirewallService } from '@/services/edge-firewall-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: 1,
    name: 'test',
    active: true,
    modules: {
      edge_functions_enabled: true,
      network_protection_enabled: true,
      waf_enabled: true,
    },
    debug_rules: true,
    domains: [],
    ddosProtectionUnmetered: true
  }
}

const makeSut = () => {
  const sut = loadEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.mock }
    })
    const { sut } = makeSut()

    await sut({ id: fixtures.mock.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${fixtures.mock.id}`,
      method: 'GET'
    })
  })

  it('should parsed correctly the returned edge firewall', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixtures.mock }
    })
    const { sut } = makeSut()

    const result = await sut({ id: fixtures.mock.id })

    expect(result).toEqual({
      id: fixtures.mock.id,
      name: fixtures.mock.name,
      isActive: fixtures.mock.active,
      edgeFunctionsEnabled: fixtures.mock.modules.edge_functions_enabled,
      networkProtectionEnabled: fixtures.mock.modules.network_protection_enabled,
      wafEnabled: fixtures.mock.modules.waf_enabled,
      debugRules: fixtures.mock.debug_rules,
      domains: fixtures.mock.domains,
      ddosProtectionUnmetered: fixtures.mock.ddosProtectionUnmetered
    })
  })
})
