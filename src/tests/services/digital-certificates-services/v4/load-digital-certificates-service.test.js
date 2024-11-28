import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { loadDigitalCertificatesService } from '@/services/digital-certificates-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  apiResponse: {
    statusCode: 200,
    body: {
      data: {
        id: 1,
        name: 'Certificate 1'
      }
    }
  }
}

const makeSut = () => {
  const sut = loadDigitalCertificatesService

  return {
    sut
  }
}

describe('LoadDigitalCertificatesService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.apiResponse)
    const { sut } = makeSut()
    const globalId = '123'

    await sut(globalId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/digital_certificates/certificates/123?fields=id,name',
      method: 'GET'
    })
  })

  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.apiResponse)
    const { sut } = makeSut()
    const globalId = '123'

    const result = await sut(globalId)

    expect(result).toEqual({
      id: 1,
      name: 'Certificate 1'
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
    },
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {}
      })
      const { sut } = makeSut()

      const response = sut('123')

      expect(response).rejects.toBe(expectedError)
    }
  )
})