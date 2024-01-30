import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editResourcesServices } from '@/services/edge-service-resources-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mockPayload: {
    id: 123,
    edgeServiceId: 123,
    content: 'some content',
    contentType: 'some content type',
    trigger: 'some trigger',
    name: 'some name'
  },
  mockResponse: {
    content: 'some content',
    content_type: 'some content type',
    trigger: 'some trigger',
    name: 'some name'
  }
}

const makeSut = () => {
  const sut = editResourcesServices

  return {
    sut
  }
}

describe('EdgeServiceResourcesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const version = 'v3'
    const { sut } = makeSut()

    await sut(fixtures.mockPayload)
    const { id, edgeServiceId } = fixtures.mockPayload

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_services/${edgeServiceId}/resources/${id}`,
      method: 'PATCH',
      body: fixtures.mockResponse
    })
  })

  it('should return a feedback message on successfully edited', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.mockResponse
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mockPayload)

    expect(feedbackMessage).toBe('Edge Service Resource has been updated')
  })

  it('Should return an API error when API detect an invalid configuration to edge service resource', async () => {
    const apiErrorMock = 'Some invalid configuration has been found on the backend'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.mockPayload)

    expect(feedbackMessage).rejects.toBe(apiErrorMock)
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

      const response = sut(fixtures.mockPayload)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
