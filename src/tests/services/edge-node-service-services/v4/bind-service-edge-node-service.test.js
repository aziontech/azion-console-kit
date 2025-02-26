import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { bindServiceEdgeNodeService } from '@/services/edge-node-service-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: '123',
    serviceId: '123'
  }
}
const makeSut = () => {
  const sut = bindServiceEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: []
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/edge_orchestrator/edge_nodes/${fixtures.mock.id}/services`,
      body: {
        service_id: '123'
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: []
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.mock)

    expect(feedback).toBe('Service was added to the edge node')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        detail: 'Internal server error'
      }
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.mock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
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

    const apiErrorResponse = sut(fixtures.mock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })
})
