import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { deleteResourcesServices } from '@/services/edge-service-resources-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    id: 123,
    edgeServiceId: 123
  }
}

const makeSut = () => {
  const sut = deleteResourcesServices

  return {
    sut
  }
}

describe('EdgeServiceResourcesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })
    const version = 'v3'
    const { sut } = makeSut()
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'DELETE',
      url: `${version}/edge_services/${fixtures.mock.edgeServiceId}/resources/${fixtures.mock.id}`
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Edge Service Resource successfully deleted')
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
