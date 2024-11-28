import { createDeviceGroupService } from '@/services/edge-application-device-groups-services/v4'
import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  deviceGroupPayload: {
    edgeApplicationId: '1234',
    name: 'teste',
    userAgent: '*'
  }
}

const makeSut = () => {
  const sut = createDeviceGroupService

  return { sut }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: {
        results: {}
      }
    })

    const { sut } = makeSut()
    await sut(fixtures.deviceGroupPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.deviceGroupPayload.edgeApplicationId}/device_groups`,
      method: 'POST',
      body: {
        name: fixtures.deviceGroupPayload.name,
        user_agent: fixtures.deviceGroupPayload.userAgent
      }
    })
  })

  it('Should return an API array error to an invalid device group', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.deviceGroupPayload)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
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

    const apiErrorResponse = sut(fixtures.deviceGroupPayload)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})

it('should return a feedback message on successfully created', async () => {
  vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
    statusCode: 202,
    body: {
      results: {}
    }
  })
  const { sut } = makeSut()

  const { feedback } = await sut(fixtures.deviceGroupPayload)

  expect(feedback).toBe('Device Group successfully created')
})
