import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteCacheSettingsService } from '@/services/edge-application-cache-settings-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 1920763586747,
  cacheSettingsId: 181729637
}

const makeSut = () => {
  const sut = deleteCacheSettingsService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.edgeApplicationId}/cache_settings/${fixtures.cacheSettingsId}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    const feedback = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsId
    })

    expect(feedback).toBe('Cache Settings successfully deleted')
  })

  it('should return api validation errors on status 409', async () => {
    const apiErrorMessage =
      'This cache settings can not be deleted because is already in use by a edge application'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 409,
      body: {
        error: apiErrorMessage
      }
    })

    const { sut } = makeSut()
    const response = sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsId
    })

    expect(response).rejects.toBe(apiErrorMessage)
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
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })

      const { sut } = makeSut()

      const response = sut({
        edgeApplicationId: fixtures.edgeApplicationId,
        id: fixtures.cacheSettingsId
      })

      expect(response).rejects.toBe(expectedError)
    }
  )
})
