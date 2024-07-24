import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    id: 1987867,
    name: 'Az-dns',
    code: 'port=123',
    active: true
  }
}

const makeSut = () => {
  const sut = editEdgeServiceServices

  return {
    sut
  }
}

describe('EdgeServiceServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut(fixtures.mock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/orchestrator/edge_services/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        active: fixtures.mock.active,
        name: fixtures.mock.name,
        variables: [
          {
            name: 'port',
            value: '123'
          }
        ]
      }
    })
  })

  it('should call API with correct params but the code parameter is empty', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()
    await sut({ ...fixtures.mock, code: '' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/orchestrator/edge_services/${fixtures.mock.id}`,
      method: 'PATCH',
      body: {
        active: fixtures.mock.active,
        name: fixtures.mock.name,
        variables: []
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your edge service has been updated')
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

    const feedbackMessage = sut(fixtures.mock)

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

      const response = sut(fixtures.mock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
