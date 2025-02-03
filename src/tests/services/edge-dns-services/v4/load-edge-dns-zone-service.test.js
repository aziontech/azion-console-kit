import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadEdgeDNSService } from '@/services/edge-dns-services/v4/load-edge-dns-zone-service'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/edge-dns-services/v4/make-edge-dns-base-url', () => ({
  makeEdgeDNSBaseUrl: () => 'v4/edge_dns'
}))

const fixtures = {
  id: '123456',
  edgeDNSMock: {
    data: {
      id: '123456',
      name: 'mockName',
      domain: 'example.com',
      active: true
    }
  }
}

const makeSut = () => {
  const sut = loadEdgeDNSService

  return { sut }
}

describe('EdgeDNSServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.edgeDNSMock
    })

    const { sut } = makeSut()
    await sut({ id: fixtures.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.id}`,
      method: 'GET'
    })
  })

  it('should return parsed edge dns data correctly', async () => {
    const mockResponse = {
      statusCode: 200,
      body: fixtures.edgeDNSMock
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(mockResponse)

    const { sut } = makeSut()
    const result = await sut({ id: fixtures.id })

    const expectedResponse = {
      id: fixtures.edgeDNSMock.data.id,
      name: fixtures.edgeDNSMock.data.name,
      domain: fixtures.edgeDNSMock.data.domain,
      isActive: fixtures.edgeDNSMock.data.active
    }

    expect(result).toEqual(expectedResponse)
  })

  it('should throw an error when request fails', async () => {
    const errorMock = new Error('Request failed')
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockRejectedValueOnce(errorMock)

    const { sut } = makeSut()
    const promise = sut({ id: fixtures.id })

    await expect(promise).rejects.toThrow('Request failed')
  })
})
