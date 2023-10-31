import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { resetPasswordService } from '@/services/auth-services'

const fixtures = {
  userData: {
    password: 'Azn1234!',
    uidb64: 'MjYyNw',
    token: '6fm-c07c9d5f5d6f2e450555'
  }
}

const makeSut = () => {
  const sut = resetPasswordService

  return { sut }
}

describe('ResetPasswordService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures.userData)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `password/new`,
      method: 'POST',
      body: {
        password: fixtures.userData.password,
        uidb64: fixtures.userData.uidb64,
        token: fixtures.userData.token
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.userData)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
