import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { signupService } from '@/services/signup-services/signup-service'

const userPayloadMock = {
  name: 'john doe',
  email: 'john.doe@example.com',
  captch: 'default'
}

const makeSut = () => {
  const sut = signupService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(userPayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `signup`,
      method: 'POST',
      body: { ...userPayloadMock }
    })
  })

  it('should not return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(userPayloadMock)

    expect(feedbackMessage).toBe(null)
  })

  it('Should return an API error for an 400 response status', async () => {
    const response = {
      email: ['This email is already taken by another account!']
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { ...response }
    })
    const { sut } = makeSut()

    const request = sut(userPayloadMock)

    expect(request).rejects.toThrow(response.email[0])
  })

  it.each([
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

      const request = sut(userPayloadMock)

      expect(request).rejects.toBe(expectedError)
    }
  )
})
