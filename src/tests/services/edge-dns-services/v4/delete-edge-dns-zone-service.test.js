import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteEdgeDnsZoneService } from '@/services/edge-dns-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  zoneId: '181729637'
}

const makeSut = () => {
  const sut = deleteEdgeDnsZoneService

  return { sut }
}

describe('EdgeDNSServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    await sut(fixtures.zoneId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/edge_dns/zones/181729637',
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const feedback = await sut(fixtures.zoneId)

    expect(feedback).toBe('Your Edge DNS has been deleted')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()
    const apiErrorResponse = sut(fixtures.zoneId)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()
    const apiErrorResponse = sut(fixtures.zoneId)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
