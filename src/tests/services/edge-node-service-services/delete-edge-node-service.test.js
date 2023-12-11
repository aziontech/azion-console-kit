import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteServiceEdgeNodeService } from '@/services/edge-node-service-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteServiceEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = { edgeNodeId: 123, serviceId: 123 }
    const { sut } = makeSut()

    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `edge_node/${mockId.edgeNodeId}/services/${mockId.serviceId}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 123

    const { sut } = makeSut()

    const feedbackMessage = await sut(mockId)

    expect(feedbackMessage).toBe('Service on Edge Node successfully deleted')
  })
})
