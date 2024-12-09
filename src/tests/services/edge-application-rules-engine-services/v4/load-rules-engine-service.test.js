import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadRulesEngineService } from '@/services/edge-application-rules-engine-services/v4/load-rules-engine-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 4516528793898,
  rulesEngineMock: {
    data: {
      id: 123456,
      name: 'mockRuleName',
      phase: 'request',
      criteria: [
        {
          entries: [
            {
              variable: 'mockVariable',
              operator: 'mockOperator',
              value: 'mockValue'
            }
          ]
        }
      ],
      behaviors: [
        {
          name: 'mockBehavior',
          argument: 'mockTarget'
        }
      ],
      is_active: true,
      order: 1,
      description: 'mockDescription'
    }
  }
}

const makeSut = () => {
  const sut = loadRulesEngineService
  return { sut }
}

describe('EdgeApplicationRulesEngineServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.rulesEngineMock
    })

    const { sut } = makeSut()
    await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.rulesEngineMock.data.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.edgeApplicationId}/rules/${fixtures.rulesEngineMock.data.id}`,
      method: 'GET'
    })
  })

  it('should return parsed data correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.rulesEngineMock
    })

    const { sut } = makeSut()
    const result = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.rulesEngineMock.data.id
    })

    expect(result).toStrictEqual({
      id: fixtures.rulesEngineMock.data.id,
      name: fixtures.rulesEngineMock.data.name,
      phase: fixtures.rulesEngineMock.data.phase,
      criteria: fixtures.rulesEngineMock.data.criteria,
      behaviors: [
        {
          name: 'mockBehavior',
          target: 'mockTarget'
        }
      ],
      isActive: fixtures.rulesEngineMock.data.is_active,
      order: fixtures.rulesEngineMock.data.order,
      description: fixtures.rulesEngineMock.data.description
    })
  })
})
