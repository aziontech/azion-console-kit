import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { sendResetPasswordEmailService } from '@/services/auth-services'

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
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures.validEmail)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `password/request`,
      method: 'POST',
      body: {
        email: fixtures.validEmail.email
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.validEmail)

    expect(feedbackMessage).toBe('Email sent successfully')
  })
})
