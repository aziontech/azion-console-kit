import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeNodeService } from '@/services/edge-node-services'

import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    id: 13,
    edgeServiceID: 1987867,
    name: 'Az-dns',
    hashId: 'a1b2c3d4e5f6g7h8i9j0',
    groups: [],
    status: true,
    hasServices: false
  }
}

const makeSut = () => {
  const sut = editEdgeNodeService

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
    const version = 'v3'
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_nodes/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        groups: [],
        hashId: 'a1b2c3d4e5f6g7h8i9j0',
        name: 'Az-dns',
        status: true,
        has_services: false
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your edge node has been updated')
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
