import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const parsedBehavior = [
  { name: 'add_request_cookie', target: 'add request cookie' },
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
  { name: 'deliver', target: undefined }
]

const fixtures = {
  rulePayload: {
    id: 12321,
    name: 'teste name',
    phase: { content: 'request' },
    behaviors: [
      {
        name: 'add_request_cookie',
        target: 'add request cookie'
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
    ],
    criteria: '',
    is_active: true,
    description: 'description',
    order: 3
  }
}

const makeSut = () => {
  const sut = editRulesEngineService

  return {
    sut
  }
}

describe('EdgeApplicationRulesEngineServices', () => {
  it('should call API with correct params when updating the rule engine data', async () => {
    const edgeApplicationIdMock = 123
    const phaseRulesMock = fixtures.rulePayload.phase.content
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut({ id: edgeApplicationIdMock, payload: fixtures.rulePayload, reorder: false })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${edgeApplicationIdMock}/rules_engine/${phaseRulesMock}/rules/${fixtures.rulePayload.id}`,
      method: 'PATCH',
      body: {
        behaviors: parsedBehavior,
        criteria: '',
        description: 'description',
        is_active: undefined,
        name: 'teste name',
        phase: 'request'
      }
    })
  })

  it('should call API with correct params update the rule engine order', async () => {
    const edgeApplicationIdMock = 123
    const phaseRulesMock = fixtures.rulePayload.phase.content

    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut({
      id: edgeApplicationIdMock,
      payload: fixtures.rulePayload,
      reorder: true
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${edgeApplicationIdMock}/rules_engine/${phaseRulesMock}/rules/${fixtures.rulePayload.id}`,
      method: 'PATCH',
      body: {
        order: fixtures.rulePayload.order
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    const edgeApplicationIdMock = 8172367
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut({ id: edgeApplicationIdMock, payload: fixtures.rulePayload })

    expect(feedbackMessage).toBe('Your Rules Engine has been edited')
  })

  it('should calculate correct default rule phase', async () => {
    const edgeApplicationIdMock = 112365
    const ruleWithDefaultPhaseMock = {
      ...fixtures.rulePayload,
      phase: 'default'
    }
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut({
      id: edgeApplicationIdMock,
      payload: ruleWithDefaultPhaseMock
    })

    expect(requestSpy.mock.lastCall[0].url).toBe(
      `v3/edge_applications/${edgeApplicationIdMock}/rules_engine/request/rules/${ruleWithDefaultPhaseMock.id}`
    )
  })

  it('should parse correctly the API error validation', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        behaviors: {
          incompatible_behaviors: [
            "(u'set_cache_policy', ['deny', 'redirect_to_301', 'redirect_to_302'])"
          ]
        }
      }
    })

    const { sut } = makeSut()

    const result = sut({
      id: 762356,
      payload: fixtures.rulePayload,
      reorder: false
    })

    expect(result).rejects.toBe("The behavior 'set cache policy' is incompatible with the others.")
  })

  it('should parse correctly the API validation with multiple error messages', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: ['first error message', 'second error message']
      }
    })

    const { sut } = makeSut()

    const result = sut({
      id: 762356,
      payload: fixtures.rulePayload,
      reorder: false
    })

    expect(result).rejects.toBe('errors: first error message')
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
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const edgeApplicationId = 123
      const response = sut({ id: edgeApplicationId, payload: fixtures.rulePayload })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
