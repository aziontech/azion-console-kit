import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteNetworkListService } from '@/services/network-lists-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteNetworkListService

  return {
    sut
  }
}

describe('NetworkListsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const { sut } = makeSut()
    const networkIdMock = 987678

    await sut(networkIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `network_lists/${networkIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const networkIdMock = 987678
    const { sut } = makeSut()

    const feedbackMessage = await sut(networkIdMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
