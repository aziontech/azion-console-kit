import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createEdgeFunctionsService } from '@/services/edge-functions-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    name: 'Func 1',
    code: "console.log('hello!');",
    jsonArgs: '{}',
    language: 'javascript',
    initiatorType: null,
    active: true
  }
}

const makeSut = () => {
  const sut = createEdgeFunctionsService

  return {
    sut
  }
}

describe('EdgeFunctionsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_functions`,
      method: 'POST',
      body: {
        name: fixtures.basic.name,
        code: fixtures.basic.code,
        json_args: {},
        initiator_type: fixtures.basic.initiatorType,
        language: fixtures.basic.language,
        active: fixtures.basic.active
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.basic)

    expect(data.feedback).toBe('Your edge function has been created')
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
