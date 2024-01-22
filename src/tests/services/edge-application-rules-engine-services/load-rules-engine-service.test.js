import { describe, expect, it, vi } from 'vitest'
import { loadRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const fixtures = {
  ruleEngineMock: {
    id: 12321,
    name: 'teste name',
    phase: { content: 'request' },
    behaviors: '',
    criteria: '',
    is_active: true,
    description: 'description',
    order: 3
  },
  edgeApplicationIdMock: 42176583
}

const makeSut = () => {
  const sut = loadRulesEngineService
  return {
    sut
  }
}

describe('EdgeApplicationRulesEnginesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.ruleEngineMock
      }
    })
    const { sut } = makeSut()

    await sut({
      edgeApplicationId: fixtures.edgeApplicationIdMock,
      id: fixtures.ruleEngineMock.id,
      phase: fixtures.ruleEngineMock.phase
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.edgeApplicationIdMock}/rules_engine/request/rules/${fixtures.ruleEngineMock.id}`,
      method: 'GET'
    })
  })

  it('should calculate correctly the rule engine phase', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.ruleEngineMock
      }
    })
    const { sut } = makeSut()

    await sut({
      edgeApplicationId: fixtures.edgeApplicationIdMock,
      id: fixtures.ruleEngineMock.id,
      phase: { content: 'Default' }
    })

    expect(requestSpy.mock.lastCall[0].url).toBe(
      `v3/edge_applications/${fixtures.edgeApplicationIdMock}/rules_engine/request/rules/${fixtures.ruleEngineMock.id}`
    )
  })
})
