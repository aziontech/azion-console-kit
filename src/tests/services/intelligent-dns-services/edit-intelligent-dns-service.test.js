import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
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
      statusCode: 200
    })
    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.dnsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/intelligent_dns/${fixtures.dnsMock.id}`,
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
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.dnsMock)

    expect(feedbackMessage).toBe('Intelligent DNS has been updated')
  })

  it('Should return an API validation on update an invalid Intelligent DNS', async () => {
    const apiErrorMock = 'API validation error, this iDNS is invalid'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { errorKey: [apiErrorMock] }
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
