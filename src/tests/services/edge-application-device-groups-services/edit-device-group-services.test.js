import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editDeviceGroupService } from '@/services/edge-application-device-groups-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  deviceGroupPayload: {
    id: '123',
    edgeApplicationId: '1234',
    name: 'teste',
    userAgent: '*'
  }
}

const makeSut = () => {
  const sut = editDeviceGroupService

  return {
    sut
  }
}

describe('EdgeApplicationDeviceGroupsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const version = 'v3'

    await sut(fixtures.deviceGroupPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.deviceGroupPayload.edgeApplicationId}/device_groups/${fixtures.deviceGroupPayload.id}`,
      method: 'PATCH',
      body: {
        name: fixtures.deviceGroupPayload.name,
        user_agent: fixtures.deviceGroupPayload.userAgent
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.deviceGroupPayload)

    expect(feedbackMessage).toBe('Your Device Group has been edited')
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
  it('Should return an API error to an invalid device group', async () => {
    const apiErrorMock = 'name should not be empty'

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: apiErrorMock
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.deviceGroupPayload)

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

      const response = sut(fixtures.deviceGroupPayload)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
