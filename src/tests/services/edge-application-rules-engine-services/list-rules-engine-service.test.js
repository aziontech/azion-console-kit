import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  rulesEngine: {
    id: 353622,
    name: 'teste 1',
    phase: 'request',
    behaviors: [
      {
        name: 'no_content',
        target: null
      }
    ],
    criteria: [
      [
        {
          variable: '${uri}',
          operator: 'is_not_equal',
          conditional: 'if',
          input_value: '2'
        }
      ]
    ],
    is_active: true,
    order: 2,
    description: 'teste'
  }
}

const makeSut = () => {
  const sut = listRulesEngineService

  return { sut }
}

describe('EdgeApplicationRulesEngineServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ id: edgeApplicationId, phase: 'request' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/rules_engine/request/rules?order_by=order&sort=asc&page=1&page_size=200`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.rulesEngine]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })

    expect(result).toEqual([
      {
        id: fixtures.rulesEngine.id,
        name: fixtures.rulesEngine.name,
        phase: {
          content: 'Request',
          outlined: true,
          severity: 'info'
        },
        behaviors: fixtures.rulesEngine.behaviors,
        criteria: fixtures.rulesEngine.criteria,
        status: {
          content: 'Active',
          severity: 'success'
        },
        order: 2,
        description: 'teste'
      }
    ])
  })

  it('should return empty array when there is no rules engine', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })
    expect(result).toHaveLength(0)
  })
})
