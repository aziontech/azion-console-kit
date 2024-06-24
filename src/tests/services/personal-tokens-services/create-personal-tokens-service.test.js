import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createPersonalToken } from '@/services/personal-tokens-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  personalTokenMock: {
    name: 'Test Token',
    description: 'This is a test token',
    expiresAt: '2023-12-31'
  }
}

const makeSut = () => {
  const sut = createPersonalToken

  return {
    sut
  }
}

describe('PersonalTokensServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        key: 'test-token'
      }
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.personalTokenMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/personal_tokens`,
      method: 'POST',
      body: {
        name: fixtures.personalTokenMock.name,
        description: fixtures.personalTokenMock.description,
        expires_at: fixtures.personalTokenMock.expiresAt
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        key: 'test-token'
      }
    })
    const { sut } = makeSut()

    const { feedback, token } = await sut(fixtures.personalTokenMock)

    expect(token).toBe('test-token')
    expect(feedback).toBe('Personal token has been created')
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

      const response = sut(fixtures.personalTokenMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
