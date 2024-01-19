import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createRulesEngineService } from '@/services/edge-application-rules-engine-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  ruleEngineMock: {
    edgeApplicationId: 415267839,
    name: 'teste name',
    phase: 'request',
    behaviors: 'behaviors-mock',
    criteria: 'mock-criteria',
    isActive: true,
    description: 'description'
  }
}

const makeSut = () => {
  const sut = createRulesEngineService

  return { sut }
}

describe('EdgeApplicationRulesEnginesServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.ruleEngineMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.ruleEngineMock.edgeApplicationId}/rules_engine/request/rules`,
      method: 'POST',
      body: {
        name: fixtures.ruleEngineMock.name,
        phase: fixtures.ruleEngineMock.phase,
        criteria: fixtures.ruleEngineMock.criteria,
        behaviors: fixtures.ruleEngineMock.behaviors,
        is_active: fixtures.ruleEngineMock.isActive,
        description: fixtures.ruleEngineMock.description
      }
    })
  })

  it('should parse API error correctly on not-found requests', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        error: 'this is an validation error message from API'
      }
    })
    const { sut } = makeSut()

    const result = sut(fixtures.ruleEngineMock)

    expect(result).rejects.toBe('error: this is an validation error message from API')
  })

  it('should parse API error correctly when internal server errors occur ', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        error: 'this is an internal API server error message'
      }
    })
    const { sut } = makeSut()

    const result = sut(fixtures.ruleEngineMock)

    expect(result).rejects.toBe('error: this is an internal API server error message')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.ruleEngineMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
