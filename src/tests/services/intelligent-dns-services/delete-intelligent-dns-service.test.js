import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteIntelligentDNSService } from '@/services/intelligent-dns-services'
import * as Errors from '@/services/axios/errors'
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
    const version = 'v3'
    await sut(dnsIdMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns/${dnsIdMock}`,
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

    expect(feedbackMessage).toBe('Your Intelligent DNS has been deleted')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with status code $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const dnsIdStub = 71625367
      const { sut } = makeSut()

      const response = sut(dnsIdStub)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
