import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteEdgeFirewallService } from '@/services/edge-firewall-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteEdgeFirewallService

  return {
    sut
  }
}

describe('EdgeFirewallServices', () => {
  it('should call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const mockId = 12387555
    const { sut } = makeSut()
    const version = 'v3'
    await sut(mockId)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${version}/edge_firewall/${mockId}`
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
