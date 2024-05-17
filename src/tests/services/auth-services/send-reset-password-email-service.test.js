import { sendResetPasswordEmailService } from '@/services/auth-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  validEmail: {
    email: 'azionbrand@azion.com'
  }
}

const makeSut = () => {
  const sut = sendResetPasswordEmailService

  return { sut }
}

describe('SendResetPasswordEmailService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(fixtures.validEmail)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/iam/user/password/request`,
      method: 'POST',
      body: {
        email: fixtures.validEmail.email
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.validEmail)

    expect(feedbackMessage).toBe('Email sent successfully')
  })

  it('should return a feedback message when status code is 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400
    })
    const { sut } = makeSut()

    const request = sut(fixtures.validEmail)

    expect(request).rejects.toBe('Error sending email')
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

      const request = sut(fixtures.validEmail)

      expect(request).rejects.toBe(expectedError)
    }
  )
})
