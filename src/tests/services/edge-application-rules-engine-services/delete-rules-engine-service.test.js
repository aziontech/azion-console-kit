import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: '123',
  ruleId: '1234'
}

const makeSut = () => {
  const sut = deleteRulesEngineService

  return { sut }
}

describe('EdgeApplicationRulesEnginesServices', () => {
  it('should call API with correct params', async () => {
    const phaseMock = 'request'
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const { sut } = makeSut()

    await sut({
      ruleId: fixtures.ruleId,
      phase: phaseMock,
      edgeApplicationId: fixtures.edgeApplicationId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.edgeApplicationId}/rules_engine/${phaseMock}/rules/${fixtures.ruleId}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    const phase = 'request'
    const feedbackMessage = await sut({
      ruleId: fixtures.ruleId,
      phase,
      edgeApplicationId: fixtures.edgeApplicationId
    })

    expect(feedbackMessage).toBe('Rule Engine successfully deleted')
  })

  it('should return the api error message when payload contains invalid data', async () => {
    const firstErrorMessageMock = 'Invalid rule engine error message'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        invalidRuleErrorKey: firstErrorMessageMock,
        anotherInvalidKeyError: 'Another invalid rule engine message'
      }
    })

    const { sut } = makeSut()

    const result = sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      phase: 'request',
      ruleId: fixtures.ruleId
    })

    expect(result).rejects.toBe(firstErrorMessageMock)
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

      const phase = 'request'
      const response = sut({
        ruleId: fixtures.ruleId,
        phase,
        edgeApplicationId: fixtures.edgeApplicationId
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
