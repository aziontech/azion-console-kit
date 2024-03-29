import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createEdgeDNSService } from '@/services/edge-dns-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsMock: {
    name: 'Az-dns',
    domain: 'example.com',
    isActive: true
  }
}

const makeSut = () => {
  const sut = createEdgeDNSService

  return {
    sut
  }
}

describe('EdgeDnsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: [
          {
            id: 1
          }
        ]
      }
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.dnsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns`,
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
      statusCode: 201,
      body: {
        results: [
          {
            id: 1
          }
        ]
      }
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.dnsMock)

    expect(data.feedback).toBe('Your Edge DNS has been created')
  })

  it('Should return an API validation error to an already taken edge dns ', async () => {
    const apiErrorMock = 'API validation error, this eDNS already is already taken'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.dnsMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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
      const { sut } = makeSut()

      const response = sut(fixtures.dnsMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
