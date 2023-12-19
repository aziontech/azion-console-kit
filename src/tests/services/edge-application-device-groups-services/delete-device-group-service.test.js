import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteDeviceGroupService } from '@/services/edge-application-device-groups-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: '123',
  deviceGroupId: '1234'
}

const makeSut = () => {
  const sut = deleteDeviceGroupService

  return { sut }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.deviceGroupId, fixtures.edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.edgeApplicationId}/device_groups/${fixtures.deviceGroupId}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 204
    })

    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.deviceGroupId, fixtures.edgeApplicationId)

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
})
