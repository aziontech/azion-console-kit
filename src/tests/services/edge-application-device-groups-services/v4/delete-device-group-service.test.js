import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteDeviceGroupService } from '@/services/edge-application-device-groups-services/v4'
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
      statusCode: 202
    })

    const { sut } = makeSut()
    await sut(fixtures.deviceGroupId, fixtures.edgeApplicationId)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.edgeApplicationId}/device_groups/${fixtures.deviceGroupId}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202
    })

    const { sut } = makeSut()
    const feedbackMessage = await sut(fixtures.deviceGroupId, fixtures.edgeApplicationId)

    expect(feedbackMessage).toBe('Device group successfully deleted')
  })

  it('should throw when request fails with statusCode 400', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        detail: 'teste'
      }
    })

    const { sut } = makeSut()
    const expectedErrorMessage = 'teste'
    expect(sut(fixtures.deviceGroupId, fixtures.edgeApplicationId)).rejects.toBe(
      expectedErrorMessage
    )
  })

  it('should throw when request fails with statusCode 500', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()

    const response = sut(fixtures.deviceGroup, fixtures.edgeApplicationId)
    const expectedErrorMessage = new Errors.InternalServerError().message
    expect(response).rejects.toBe(expectedErrorMessage)
  })
})
