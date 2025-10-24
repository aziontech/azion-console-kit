import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createServiceEdgeNodeService } from '@/services/edge-node-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    id: '123',
    serviceId: '123',
    variables: 'port=8080',
    name: 'X Edge Service'
  }
}
const makeSut = () => {
  const sut = createServiceEdgeNodeService

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
    const version = 'v3'
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/edge_nodes/${fixtures.mock.id}/services`,
      body: {
        service_id: '123',
        variables: [
          {
            name: 'port',
            value: '8080'
          }
        ]
      }
    })
  })

  it('should call API with correct params but the variables parameter is empty', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: []
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut({ ...fixtures.mock, variables: '' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `${version}/edge_nodes/${fixtures.mock.id}/services`,
      body: {
        service_id: '123',
        variables: []
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

  it('Should return an API error to an invalid edge node name', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.mock)

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

      const response = sut(fixtures.mock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
