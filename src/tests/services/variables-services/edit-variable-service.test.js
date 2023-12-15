import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editVariableService } from '@/services/variables-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  variableMock: {
    id: 72638,
    key: 'Mongo-DB-Key',
    value: 'M0nG0-t3$$t1n-k3Y',
    secret: true
  }
}

const makeSut = () => {
  const sut = editVariableService

  return {
    sut
  }
}

describe('VariablesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.variableMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/variables/${fixtures.variableMock.id}`,
      method: 'PUT',
      body: {
        key: fixtures.variableMock.key,
        value: fixtures.variableMock.value,
        secret: fixtures.variableMock.secret
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.variableMock)

    expect(feedbackMessage).toBe('Your variable has been updated')
  })

  it.each([
    {
      scenario: 'already used variable key',
      apiErrorMock: 'already used key',
      errorKey: 'non_field_errors'
    },
    {
      scenario: 'invalid character is used in key field',
      apiErrorMock: 'invalid key',
      errorKey: 'key'
    },
    {
      scenario: 'invalid character is used in value field',
      apiErrorMock: 'invalid key',
      errorKey: 'value'
    }
  ])('Should return an API error for an $scenario', async ({ errorKey, apiErrorMock }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.variableMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

      const response = sut(fixtures.variableMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
