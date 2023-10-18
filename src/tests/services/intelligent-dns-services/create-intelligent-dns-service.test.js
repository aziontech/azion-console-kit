import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createIntelligentDNSService } from '@/services/intelligent-dns-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    name: 'Az-dns',
    domain: 'example.com',
    isActive: true
  }
}

const makeSut = () => {
  const sut = createIntelligentDNSService

  return {
    sut
  }
}

describe('IntelligentDnsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.dnsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns`,
      method: 'POST',
      body: {
        name: fixtures.dnsMock.name,
        domain: fixtures.dnsMock.domain,
        is_active: fixtures.dnsMock.isActive
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsMock)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
