import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createResourcesServices } from '@/services/edge-service-resources-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  mock: {
    edgeServiceID: '123',
    name: 'X Edge Service',
    trigger: 'TEST',
    content: 'TEST',
    contentType: 'TEST'
  }
}
const makeSut = () => {
  const sut = createResourcesServices

  return {
    sut
  }
}

describe('EdgeServiceResourcesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { edgeServiceID: '123' }
    })

    const { sut } = makeSut()

    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `edge_services/${fixtures.mock.edgeServiceID}/resources`,
      body: {
        name: 'X Edge Service',
        trigger: 'TEST',
        content: 'TEST',
        content_type: 'TEST'
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { id: '123' }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.mock)

    expect(feedback).toBe('Resource has been created')
  })

  it('Should return an API error to an invalid edge service name', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.mock)

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

      const response = sut(fixtures.mock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
