import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteIntelligentDNSService } from '@/services/intelligent-dns-services'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = deleteIntelligentDNSService

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const dnsIdMock = 8721673
    const { sut } = makeSut()

    await sut(dnsIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${dnsIdMock}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const dnsIdMock = 71625367
    const { sut } = makeSut()

    const feedbackMessage = await sut(dnsIdMock)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
