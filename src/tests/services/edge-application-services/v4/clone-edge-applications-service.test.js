import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { cloneEdgeApplicationService } from '@/services/edge-application-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationMock: {
    id: 1700594990
  },
  edgeApplicationName: 'test cloned'
}

const makeSut = () => {
  const sut = cloneEdgeApplicationService

  return {
    sut
  }
}

describe('EdgeApplicationServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut({
      edgeApplicationName: fixtures.edgeApplicationName,
      payload: fixtures.edgeApplicationMock
    })

    const version = 'v4'

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications/${fixtures.edgeApplicationMock.id}/clone`,
      method: 'POST',
      body: {
        id: fixtures.edgeApplicationMock.id,
        name: fixtures.edgeApplicationName
      }
    })
  })

  it('should return a feedback message on successfully cloned', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const data = await sut({
      edgeApplicationName: fixtures.edgeApplicationName,
      payload: fixtures.edgeApplicationMock
    })

    expect(data.feedback).toBe('Your edge application has been cloned')
  })

  it.each([
    {
      statusCode: 400,
      errorKey: 'invalid_request',
      apiErrorMock: 'invalid_request'
    },
    {
      statusCode: 403,
      errorKey: 'detail',
      apiErrorMock: 'locked'
    },
    {
      statusCode: 409,
      errorKey: 'conflict',
      apiErrorMock: 'conflict'
    }
  ])(
    'Should return an API error for an $statusCode response status',
    async ({ statusCode, errorKey, apiErrorMock }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: {
          [errorKey]: apiErrorMock
        }
      })
      const { sut } = makeSut()

      const data = sut({
        edgeApplicationName: fixtures.edgeApplicationName,
        payload: fixtures.edgeApplicationMock
      })

      expect(data).rejects.toThrow(apiErrorMock)
    }
  )

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

      const response = sut({
        edgeApplicationName: fixtures.edgeApplicationName,
        payload: fixtures.edgeApplicationMock
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
