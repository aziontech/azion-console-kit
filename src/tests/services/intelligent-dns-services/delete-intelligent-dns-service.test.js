// continuar daqui.
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteIntelligentDNSService } from '@/services/intelligent-dns-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    id: 1987867,
    name: 'Az-dns',
    domain: 'example.com',
    isActive: true
  }
}

const makeSut = () => {
  const sut = deleteIntelligentDNSService

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsMock.id)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${fixtures.dnsMock.id}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsMock.id)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })
})
