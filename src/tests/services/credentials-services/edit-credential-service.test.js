import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editCredentialService } from '@/services/credential-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  basic: {
    id: 1,
    name: 'Cred A',
    description: 'Some description',
    status: true
  }
}

const makeSut = () => {
  const sut = editCredentialService

  return {
    sut
  }
}

describe('CredentialServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.basic)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `credentials/${fixtures.basic.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.basic.name,
        description: fixtures.basic.description,
        status: fixtures.basic.status
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.basic)

    expect(feedbackMessage).toBe('Your credential has been updated')
  })

  it.each([
    {
      scenario: 'already used name',
      apiErrorMock: 'already used name',
      errorKey: 'non_field_errors'
    },
    {
      scenario: 'invalid character is used in name field',
      apiErrorMock: 'invalid key',
      errorKey: 'key'
    }
  ])('Should return an API error for an $scenario', async ({ errorKey, apiErrorMock }) => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        [errorKey]: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.basic)

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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const stubId = '123'
      const { sut } = makeSut()

      const response = sut(stubId)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
