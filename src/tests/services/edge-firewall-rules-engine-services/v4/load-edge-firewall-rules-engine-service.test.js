import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeFirewallRulesEngineService } from '@/services/edge-firewall-rules-engine-services/v4'
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
      body: { data: fixture.rulesEngine }
    })
    const { sut } = makeSut()

    await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_firewall/firewalls/${EDGE_FIREWALL_ID}/rules/${RULES_ENGINE_ID}`,
      method: 'GET'
    })
  })

  it('should correctly parse the returned edge firewall rules engine', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: fixture.rulesEngine }
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

  it('should correctly analyze the network criteria', async () => {
    const rulesEngineWithNetworkCriteria = {
      ...fixture.rulesEngine,
      criteria: [
        [
          {
            variable: 'network',
            operator: 'is_in_list',
            conditional: 'if',
            argument: 66
          }
        ]
      ]
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: rulesEngineWithNetworkCriteria }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result.criteria).toEqual([
      [
        {
          variable: 'network',
          operator: 'is_in_list',
          conditional: 'if',
          argument: '66'
        }
      ]
    ])
  })

  it('should correctly analyze the run_function behavior.', async () => {
    const rulesEngineWithRunFunction = {
      ...fixture.rulesEngine,
      behaviors: [
        {
          name: 'run_function',
          argument: '123'
        }
      ]
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: rulesEngineWithRunFunction }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result.behaviors).toEqual([
      {
        name: 'run_function',
        functionId: 123
      }
    ])
  })

  it('should correctly analyze the set_waf_ruleset_and_waf_mode behavior', async () => {
    const rulesEngineWithWAF = {
      ...fixture.rulesEngine,
      behaviors: [
        {
          name: 'set_waf_ruleset_and_waf_mode',
          argument: {
            waf_mode: 'blocking',
            set_waf_ruleset_and_waf_mode: '456'
          }
        }
      ]
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: rulesEngineWithWAF }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result.behaviors).toEqual([
      {
        name: 'set_waf_ruleset_and_waf_mode'
      }
    ])
  })

  it('should correctly analyze the set_rate_limit behavior', async () => {
    const rulesEngineWithWAF = {
      ...fixture.rulesEngine,
      behaviors: [
        {
          name: 'set_rate_limit',
          argument: {
            name: 'teste_name',
            type: 'type',
            limit_by: 10,
            average_rate_limit: 100,
            maximum_burst_size: 2
          }
        }
      ]
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: rulesEngineWithWAF }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result.behaviors).toEqual([
      {
        name: 'set_rate_limit',
        type: 'type',
        limit_by: 10,
        average_rate_limit: 100,
        maximum_burst_size: 2
      }
    ])
  })

  it('should correctly analyze the set_custom_response behavior', async () => {
    const rulesEngineWithWAF = {
      ...fixture.rulesEngine,
      behaviors: [
        {
          name: 'set_custom_response',
          argument: {
            status_code: '400',
            content_type: 'json',
            content_body: 'content'
          }
        }
      ]
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: rulesEngineWithWAF }
    })
    const { sut } = makeSut()

    const result = await sut({ edgeFirewallId: EDGE_FIREWALL_ID, id: RULES_ENGINE_ID })

    expect(result.behaviors).toEqual([
      {
        name: 'set_custom_response',
        status_code: '400',
        content_type: 'json',
        content_body: 'content'
      }
    ])
  })
})
