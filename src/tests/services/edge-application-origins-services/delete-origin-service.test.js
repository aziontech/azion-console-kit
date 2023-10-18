import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteOriginsService } from '@/services/edge-application-origins-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 123,
  originKey: '0000000-00000000-00a0a00s0as0-000000'
}

function makeSut() {
  const sut = deleteOriginsService

  return { sut }
}

describe('DeleteOriginService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    await sut(fixtures.originKey, fixtures.edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `edge_applications/${fixtures.edgeApplicationId}/origins/${fixtures.originKey}`,
      method: 'DELETE'
    })
  });

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.originKey, fixtures.edgeApplicationId)

    expect(feedbackMessage).toBe('Resource successfully deleted')
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })

      const { sut } = makeSut()

      const response = sut(fixtures.originKey, fixtures.edgeApplicationId)

      expect(response).rejects.toBe(expectedError)
    }
  )
});