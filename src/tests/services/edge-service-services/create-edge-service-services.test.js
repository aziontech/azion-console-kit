import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createEdgeServiceServices } from '@/services/edge-service-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeServiceMock: {
    name: 'X Edge Service',
    code: 'port=8080\ngreeting=Hello',
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
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()
    await sut(fixtures.edgeServiceMock)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/orchestrator/edge_services`,
      body: {
        is_active: false,
        name: 'X Edge Service',
        modules: [
          {
            port: '8080'
          },
          {
            greeting: 'Hello'
          }
        ]
      }
    })
  })

  it('should call API with correct params but the code parameter is empty', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    await sut({ ...fixtures.edgeServiceMock, code: '' })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `v4/orchestrator/edge_services`,
      body: {
        is_active: false,
        name: 'X Edge Service',
        modules: []
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: { data: { id: '123' } }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.edgeServiceMock)

    expect(feedback).toBe('Your Edge Service has been created')
  })

  it('should return a feedback message on server accept the processing creation', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 202,
      body: { data: { id: '123123123' } }
    })

    const { sut } = makeSut()

    const { feedback } = await sut(fixtures.edgeServiceMock)

    expect(feedback).toBe('Your Edge Service is processing and will be available shortly')
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
      statusCode: 406,
      expectedError: new Errors.NotAcceptableError().message
    },
    {
      statusCode: 429,
      expectedError: new Errors.ToManyRequestsError().message
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
