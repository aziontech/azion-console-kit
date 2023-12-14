import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editServiceEdgeNodeService } from '@/services/edge-node-service-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    edgeNodeId: 13,
    id: 1987867,
    name: 'My Edge Service',
    variables: 'port=53'
  }
}

const makeSut = () => {
  const sut = editServiceEdgeNodeService

  return {
    sut
  }
}

describe('EdgeNodeServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_node/${fixtures.mock.edgeNodeId}/services/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        id: fixtures.mock.edgeNodeId,
        service_id: fixtures.mock.id,
        service_name: fixtures.mock.name,
        variables: [
          {
            name: 'port',
            value: '53'
          }
        ]
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your service on edge node has been updated')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
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
