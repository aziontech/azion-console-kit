import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteEdgeServicesService } from '@/services/edge-services-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteEdgeServicesService

  return {
    sut
  }
}

describe('EdgeServicesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 12387555
    const { sut } = makeSut()

    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `edge-services/${mockId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 123

    const { sut } = makeSut()

    const feedbackMessage = await sut(mockId)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
