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

    expect(result).rejects.toBe('this is an validation error message from API')
  })

  it('should return the first error message when multiple error messages are returned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        incompatible_behaviors: [
          "(u'set_cache_policy', ['deny', 'redirect_to_301', 'redirect_to_302'])"
        ]
      }
    })
    const { sut } = makeSut()

    const result = sut(fixtures.ruleEngineMock)

    expect(result).rejects.toBe(`The behavior 'set cache policy' is incompatible with the others.`)
  })

  it('should return the first error message when multiple error messages are returned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        error: ["(u'set_cache_policy', ['deny', 'redirect_to_301', 'redirect_to_302'])"]
      }
    })
    const { sut } = makeSut()

    const result = sut(fixtures.ruleEngineMock)

    expect(result).rejects.toBe(
      `error: (u'set_cache_policy', ['deny', 'redirect_to_301', 'redirect_to_302'])`
    )
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
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
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
