import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeDNSZonesService } from '@/services/edge-dns-services/v4/create-edge-dns-zones-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeDNSZoneMock: {
    name: 'mockName',
    domain: 'example.com',
    isActive: true
  }
}

const makeSut = () => {
  const sut = createEdgeDNSZonesService

  return { sut }
}

describe('EdgeDNSZonesService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: '123456'
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeDNSZoneMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_dns/zones',
      method: 'POST',
      body: {
        name: fixtures.edgeDNSZoneMock.name,
        domain: fixtures.edgeDNSZoneMock.domain,
        active: fixtures.edgeDNSZoneMock.isActive
      }
    })
  })

  it('should return feedback and urlToEditView when successfully create an Edge DNS Zone', async () => {
    const zoneId = '123456'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: zoneId
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.edgeDNSZoneMock)

    expect(result).toEqual({
      feedback: 'Your Edge DNS Zone has been created',
      urlToEditView: `/edge-dns/edit/${zoneId}`
    })
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        detail: 'Internal Server Error'
      }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.edgeDNSZoneMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })

  it('should throw parsing api error when request fails with non-500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.edgeDNSZoneMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })
})
