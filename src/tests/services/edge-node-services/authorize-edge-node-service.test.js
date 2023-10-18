import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { authorizeEdgeNodeService } from '@/services/edge-node-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = authorizeEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 12387555
    const { sut } = makeSut()

    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `edge_node/${mockId}`,
      body: {
        status: 'Authorized'
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const mockId = 123

    const { sut } = makeSut()

    const feedbackMessage = await sut(mockId)

    expect(feedbackMessage).toBe('Resource successfully updated')
  })
})
