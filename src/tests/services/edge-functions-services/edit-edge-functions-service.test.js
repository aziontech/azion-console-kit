import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeFunctionsService } from '@/services/edge-functions-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    id: 1,
    name: 'Func 1',
    code: "console.log('hello!');",
    jsonArgs: '{}',
    language: 'javascript',
    active: true
  }
}

const makeSut = () => {
  const sut = editEdgeFunctionsService

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_functions/${fixtures.basic.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.basic.name,
        code: fixtures.basic.code,
        json_args: {},
        initiator_type: fixtures.basic.initiatorType,
        active: fixtures.basic.active
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.basic)

    expect(feedbackMessage).toBe('Your edge function has been updated')
  })

  it('Should return an API error for an key with value String', () => {
    const apiErrorMock = 'Unable to save the JSON Args with an invalid JSON.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { invalid_json: apiErrorMock }
    })

    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.basic)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      errorKey: 'name',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'code',
      apiErrorMock: 'This field is required',
      status: 400
    },
    {
      errorKey: 'language',
      apiErrorMock: '"java" is not a valid choice. Possible choices are: [javascript, lua]',
      status: 400
    },
    {
      errorKey: 'unmapped_key',
      apiErrorMock: 'testing unmapped key',
      status: 400
    }
  ])(
    'Should return an API error for an key $errorKey',
    async ({ errorKey, apiErrorMock, status }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode: status,
        body: { [errorKey]: [apiErrorMock] }
      })
      const { sut } = makeSut()

      const feedbackMessage = sut(fixtures.basic)

      expect(feedbackMessage).rejects.toThrow(apiErrorMock)
    }
  )

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

      const response = sut(fixtures.basic)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
