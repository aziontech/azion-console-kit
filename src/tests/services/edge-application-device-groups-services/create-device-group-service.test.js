import { createDeviceGroupService } from '@/services/edge-application-device-groups-services'
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
      statusCode: 201,
      body: {
        results: {}
      }
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut(fixtures.deviceGroupPayload)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_applications/${fixtures.deviceGroupPayload.edgeApplicationId}/device_groups`,
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

  it('Should return an API error to an invalid device group ', async () => {
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

  it('Should return an API error with object to an invalid device group', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: {
        addresses: [{ address: [apiErrorMock] }]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.deviceGroupPayload)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        results: {}
      }
    })
    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.deviceGroupPayload)

    expect(feedback).toBe('Your Device Group has been created')
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
