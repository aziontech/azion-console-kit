import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createRealTimePurgeService } from '@/services/real-time-purge'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  realTimePurgeMock: {
    argumentsPurge: 'www.example.com',
    layer: 'edge_caching',
    purge_type: 'cachekey'
  }
}

const makeSut = () => {
  const sut = createRealTimePurgeService

  return {
    sut
  }
}

describe('RealTimePurgeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.realTimePurgeMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `purge/cachekey`,
      method: 'POST',
      body: {
        urls: fixtures.realTimePurgeMock.argumentsPurge.trim().split('\n'),
        method: 'delete',
        layer: fixtures.realTimePurgeMock.layer
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.realTimePurgeMock)

    expect(feedbackMessage).toBe('Your purge has been created')
  })

  it('Should return an API error for an 400 error status', async () => {
    const apiErrorMock = 'The URI is not a valid cachekey.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.realTimePurgeMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('Should return an API error for an 403 error status', async () => {
    const apiErrorMock = 'Unauthorized domain for your account'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 403,
      body: {
        detail: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.realTimePurgeMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
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

      const response = sut(fixtures.realTimePurgeMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
