import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeServiceMock: {
    name: 'X Edge Service',
    code: 'port=8080',
    active: false
  }
}
const makeSut = () => {
  const sut = createEdgeServiceServices

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { id: '123' }
    })

    const { sut } = makeSut()
    await sut(fixtures.edgeServiceMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/orchestrator/edge_services`,
      body: {
        active: false,
        name: 'X Edge Service',
        variables: [
          {
            name: 'port',
            value: '8080'
          }
        ]
      }
    })
  })

  it('should call API with correct params but the code parameter is empty', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { id: '123' }
    })

    const { sut } = makeSut()

    await sut({ ...fixtures.edgeServiceMock, code: '' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/orchestrator/edge_services`,
      body: {
        active: false,
        name: 'X Edge Service',
        variables: []
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { id: '123' }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.edgeServiceMock)

    expect(feedback).toBe('Your Edge Service has been created')
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

    const feedbackMessage = sut(fixtures.edgeServiceMock)

    expect(feedbackMessage).rejects.toThrow(apiErrorMock)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.NotFoundError().message
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
