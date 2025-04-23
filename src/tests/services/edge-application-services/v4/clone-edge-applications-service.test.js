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

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({
      edgeApplicationName: fixtures.edgeApplicationName,
      payload: fixtures.edgeApplicationMock
    })

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut({
      edgeApplicationName: fixtures.edgeApplicationName,
      payload: fixtures.edgeApplicationMock
    })
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
