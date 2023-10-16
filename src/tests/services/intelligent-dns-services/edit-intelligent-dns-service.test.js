import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editIntelligentDNSService } from '@/services/intelligent-dns-services'
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
  const sut = editIntelligentDNSService

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

    await sut(fixtures.dnsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${fixtures.dnsMock.id}`,
      method: 'PUT',
      body: {
        name: fixtures.dnsMock.name,
        domain: fixtures.dnsMock.domain,
        is_active: fixtures.dnsMock.isActive
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsMock)

    expect(feedbackMessage).toBe('Resource successfully updated')
  })
})
