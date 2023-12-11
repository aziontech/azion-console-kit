import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  mock: {
    edgeServiceID: 1987867,
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
      url: `edge_services/${fixtures.mock.edgeServiceID}`,
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

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mock)

    expect(feedbackMessage).toBe('Your edge service has been updated')
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
