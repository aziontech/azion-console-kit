import { verifyLoginMethodService } from '@/services/auth-services/get-login-method-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = verifyLoginMethodService
  return {
    sut
  }
}

describe('AuthServices', () => {
  const loginPayloadMock = {
    email: 'azion-test@test.com',
    encodedEmail: '',
  }

  it('should call login method service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(loginPayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      body: loginPayloadMock,
      method: 'GET',
      url: 'token'
    })
  })
  it('should return authentication token on success login', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValue({
      body: {
        token: 'R4nd0mT0k4n123#$'
      },
      statusCode: 200
    })
    const { sut } = makeSut()

    const response = await sut(loginPayloadMock)

    expect(response).toEqual({
      token: 'R4nd0mT0k4n123#$'
    })
  })
})
