import { describe, expect, it, vi } from 'vitest'
import { loadRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'

const parsedBehavior = [
  {
    name: 'add_request_cookie',
    target: 'add request cookie'
  },
  {
    name: 'set_origin',
    originId: '157432'
  },
  {
    name: 'capture_match_groups',
    captured_array: 'capture_array',
    subject: 'test',
    regex: '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\\.[a-zA-z]{2,3}$'
  },
  {
    name: 'set_cache_policy',
    cacheId: '407041'
  },
  {
    name: 'set_origin',
    originId: '398616'
  },
  {
    name: 'deliver'
  }
]

const fixtures = {
  ruleEngineMock: {
    id: 12321,
    name: 'teste name',
    phase: { content: 'request' },
    behaviors: [
      { name: 'add_request_cookie', target: 'add request cookie' },
      {
        name: 'set_origin',
        target: 157432
      },
      {
        name: 'capture_match_groups',
        target: {
          captured_array: 'capture_array',
          subject: 'test',
          regex: '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\\.[a-zA-z]{2,3}$'
        }
      },
      { name: 'set_cache_policy', target: '407041' },
      { name: 'set_origin', target: '398616' },
      { name: 'deliver' }
    ],
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

  it('should parsed correctly the returned rules engine', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.ruleEngineMock }
    })
    const { sut } = makeSut()

    const result = await sut({
      edgeApplicationId: fixtures.edgeApplicationIdMock,
      id: fixtures.ruleEngineMock.id,
      phase: fixtures.ruleEngineMock.phase
    })

    expect(result).toEqual({
      id: fixtures.ruleEngineMock.id,
      name: fixtures.ruleEngineMock.name,
      phase: fixtures.ruleEngineMock.phase,
      criteria: fixtures.ruleEngineMock.criteria,
      behaviors: parsedBehavior,
      isActive: fixtures.ruleEngineMock.is_active,
      order: fixtures.ruleEngineMock.order,
      description: fixtures.ruleEngineMock.description
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
