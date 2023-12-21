import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editRulesEngineService } from '@/services/edge-application-rules-engine-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  rulePayload: {
    id: 12321,
    name: 'teste name',
    phase: { content: 'request' },
    behaviors: '',
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
  it('should call API with correct params to rule engine update', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    const edgeApplicationId = 123
    const phaseRules = fixtures.rulePayload.phase.content
    await sut({ id: edgeApplicationId, payload: fixtures.rulePayload, reorder: false })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/rules_engine/${phaseRules}/rules/${fixtures.rulePayload.id}`,
      method: 'PATCH',
      body: {
        behaviors: '',
        criteria: '',
        description: 'description',
        is_active: undefined,
        name: 'teste name',
        phase: 'request'
      }
    })
  })
  it('should call API with correct params to rule engine order update', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    const edgeApplicationId = 123
    const phaseRules = fixtures.rulePayload.phase.content
    await sut({ id: edgeApplicationId, payload: fixtures.rulePayload, reorder: true })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${edgeApplicationId}/rules_engine/${phaseRules}/rules/${fixtures.rulePayload.id}`,
      method: 'PATCH',
      body: {
        order: 3
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const edgeApplicationId = 123
    const feedbackMessage = await sut({ id: edgeApplicationId, payload: fixtures.rulePayload })

    expect(feedbackMessage).toBe('Your Rules Engine has been edited')
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
