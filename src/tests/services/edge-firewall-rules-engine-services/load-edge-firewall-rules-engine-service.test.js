import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'

const EDGE_FIREWALL_ID = '123'
const RULES_ENGINE_ID = '456'

const fixture = {
  rulesEngine: {
    id: 43873,
    last_editor: 'test@azion.com',
    last_modified: '2024-07-30T16:38:23.405703Z',
    name: 'RT',
    is_active: true,
    description: '',
    behaviors: [
      {
        name: 'deny'
      }
    ],
    criteria: [
      [
        {
          variable: 'network',
          operator: 'is_in_list',
          conditional: 'if',
          argument: 66
        }
      ]
    ],
    order: 0
  },
  criteriaParsed: [
    [
      {
        variable: 'network',
        operator: 'is_in_list',
        conditional: 'if',
        argument: '66'
      }
    ]
  ]
}

const makeSut = () => {
  const sut = loadEdgeFirewallRulesEngineService
  return { sut }
}

describe('EdgeFirewallRulesEngineServices', () => {
  vi.restoreAllMocks()

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixture.rulesEngine }
    })
    const { sut } = makeSut()

    await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_firewall/${EDGE_FIREWALL_ID}/rules_engine/${RULES_ENGINE_ID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned edge firewall rules engine', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixture.rulesEngine }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallID: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result).toEqual({
      id: fixture.rulesEngine.id,
      name: fixture.rulesEngine.name,
      description: fixture.rulesEngine.description,
      active: fixture.rulesEngine.is_active,
      criteria: fixture.criteriaParsed,
      behaviors: fixture.rulesEngine.behaviors
    })
  })
})
