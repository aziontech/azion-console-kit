import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@services/axios/errors'
import { listDigitalCertificatesServiceDropdown } from '@/services/digital-certificates-services/v4'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  apiResponse: {
    statusCode: 200,
    body: {
      count: 1,
      results: [{ id: 1, name: 'Certificate 1' }]
    }
  },
  defaultCertificates: [{ id: 0, name: 'Azion (SAN)' }]
}

const makeSut = () => {
  const sut = listDigitalCertificatesServiceDropdown

  return {
    sut
  }
}

describe('DigitalCertificatesServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params and default values', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const { sut } = makeSut()

    await sut({})

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/digital_certificates/certificates?ordering=name&page=1&page_size=10&fields=&search=&type=',
      method: 'GET'
    })
  })

  it('should include default certificates when type is edge_certificate', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.apiResponse)
    const { sut } = makeSut()

    const result = await sut({ type: 'edge_certificate' })

    expect(result.body).toHaveLength(2)
    expect(result.body[0]).toEqual(fixtures.defaultCertificates[0])
    expect(result.body[1]).toEqual({
      id: 1,
      name: 'Certificate 1'
    })
    expect(result.count).toBe(2)
  })

  it('should filter default certificates when search is provided with edge_certificate type', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.apiResponse)
    const { sut } = makeSut()

    const result = await sut({
      type: 'edge_certificate',
      search: 'azion'
    })

    expect(result.body).toHaveLength(2)
    expect(result.body[0]).toEqual(fixtures.defaultCertificates[0])
    expect(result.count).toBe(2)
  })

  it('should not include default certificates when type is not edge_certificate', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        count: 1,
        results: [{ id: 1, name: 'Certificate 1' }]
      }
    })
    const { sut } = makeSut()

    const result = await sut({ type: 'other_type' })

    expect(result.body).toHaveLength(1)
    expect(result.body[0]).toEqual({
      id: 1,
      name: 'Certificate 1'
    })
    expect(result.count).toBe(1)
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
        body: { results: [] }
      })
      const { sut } = makeSut()

      const response = sut({})

      expect(response).rejects.toBe(expectedError)
    }
  )
})
