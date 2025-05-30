import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeApplicationService } from '@/services/edge-application-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplication: {
    name: 'mockName'
  },
  edgeApplicationId: 12
}
const makeSut = () => {
  const sut = createEdgeApplicationService

  return { sut }
}

describe('EdgeApplicationServicesV4', () => {
  it('should be able to call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: fixtures.edgeApplicationId
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.edgeApplication)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications`,
      method: 'POST',
      body: {
        name: fixtures.edgeApplication.name
      }
    })
  })

  it('should return a feedback when successfully create an edge application', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        data: {
          id: fixtures.edgeApplicationId
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.edgeApplication)

    expect(result).toEqual({
      feedback: 'Your edge application has been created',
      urlToEditView: `/edge-applications/config/${fixtures.edgeApplicationId}`,
      applicationId: fixtures.edgeApplicationId
    })
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

    const apiErrorResponse = sut(fixtures.edgeApplication)

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

    const apiErrorResponse = sut(fixtures.edgeApplication)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
