import { logoutService } from '@/services/auth-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = logoutService

  return {
    sut
  }
}

describe('AuthServices', () => {
  it('should call logout service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: 'logout'
    })
  })
})
