import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { editEdgeDNSService } from '@/services/edge-dns-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeDNSZoneMock: {
    id: '123456',
    name: 'Test Zone',
    domain: 'test.domain.com',
    isActive: true
  }
}

const makeSut = () => {
  const sut = editEdgeDNSService
  return { sut }
}

describe('EdgeDNSServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeDNSZoneMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_dns/zones/${fixtures.edgeDNSZoneMock.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.edgeDNSZoneMock.name,
        domain: fixtures.edgeDNSZoneMock.domain,
        active: fixtures.edgeDNSZoneMock.isActive
      }
    })
  })

  it('should return success message when zone is updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.edgeDNSZoneMock)

    expect(result).toBe('Edge DNS has been updated')
  })

  it('should throw internal server error when request fails with 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })
    const { sut } = makeSut()

    const promise = sut(fixtures.edgeDNSZoneMock)
    const expectedError = new Errors.InternalServerError().message

    await expect(promise).rejects.toBe(expectedError)
  })

  it('should throw api error when request fails with other status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })
    const { sut } = makeSut()

    const promise = sut(fixtures.edgeDNSZoneMock)

    await expect(promise).rejects.toBe('api error message')
  })
})
