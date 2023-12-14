import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteUsersService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteUsersService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const userIdMock = 765678
    const { sut } = makeSut()
    const version = 'v4'
    await sut(userIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users/${userIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const userIdMock = 7816825367
    const { sut } = makeSut()

    const feedbackMessage = await sut(userIdMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
