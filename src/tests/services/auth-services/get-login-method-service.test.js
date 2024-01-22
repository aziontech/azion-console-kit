import { verifyLoginMethodService } from '@/services/auth-services/get-login-method-service'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = verifyLoginMethodService
  return {
    sut
  }
}

const fixtures = {
  email: 'azion-test@test.com',
  encodedEmail: 'azion-test%40test.com'
}

describe('AuthServices', () => {
  it('should call login method service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut(fixtures.email)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `auth/login_method?email=${fixtures.encodedEmail}`
    })
  })
})
