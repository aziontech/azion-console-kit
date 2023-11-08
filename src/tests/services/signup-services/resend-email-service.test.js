import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { resendEmailService } from '@/services/signup-services'
import { makeResendEmailBaseUrl } from '@/services/signup-services/make-resend-email-url'

const emailPayloadMock = { email: 'john.doe@example.com' }

const makeSut = () => {
  const sut = resendEmailService

  return {
    sut
  }
}

describe('ResendEmailService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(emailPayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: makeResendEmailBaseUrl(),
      method: 'POST',
      body: emailPayloadMock
    })
  })

  it('should not return a feedback message on successfully sent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = 'Email sent successfully'

    const req = await sut(emailPayloadMock)

    expect(req).toBe(feedbackMessage)
  })

  it('Should return an API error for an 400 response status', async () => {
    const response = { email: ["User doesn't exist"] }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { ...response }
    })
    const { sut } = makeSut()

    const request = sut(emailPayloadMock)

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

      const request = sut(emailPayloadMock)

      expect(request).rejects.toBe(expectedError)
    }
  )
})
