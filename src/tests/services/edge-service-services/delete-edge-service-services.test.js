import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteEdgeServiceServices

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 12387555
    const { sut } = makeSut()

    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `v4/orchestrator/edge_services/${mockId}`
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
