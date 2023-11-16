import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeServiceService } from '@/services/edge-services-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeServiceMock: {
    name: 'X Edge Service'
  }
}
const makeSut = () => {
  const sut = createEdgeServiceService

  return {
    sut
  }
}

describe('EdgeServicesServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const edgeServiceMock = {
      name: 'X edge service'
    }
    const { sut } = makeSut()

    await sut(edgeServiceMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `edge-services`,
      body: edgeServiceMock
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const edgeServiceMock = {
      name: 'X edge service'
    }

    const { sut } = makeSut()

    const data = await sut(edgeServiceMock)

    expect(data.feedback).toBe('Your Edge Service has been created')
  })

  it('Should return an API error to an invalid edge service name', async () => {
    const apiErrorMock = 'name should not be empty'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 422,
      body: {
        errors: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.variableMock)

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

      const response = sut(fixtures.edgeServiceMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
