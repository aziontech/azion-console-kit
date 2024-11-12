import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, it, expect } from 'vitest'
import * as Errors from '@/services/axios/errors'

const mockAxios = {
  request: async () => {
    return Promise.resolve({
      data: { message: 'Success' },
      status: 200
    })
  }
}

const makeSut = () => {
  const sut = AxiosHttpClientAdapter

  return {
    sut,
    mockAxios
  }
}

describe('AxiosHttpClientAdapter', () => {
  it('should make a successful request', async () => {
    const { sut, mockAxios } = makeSut()
    const response = await sut.request(
      {
        url: 'https://example.com/api/resource',
        method: 'GET',
        headers: { Authorization: 'Bearer token' }
      },
      mockAxios
    )

    expect(response).toEqual({
      body: { message: 'Success' },
      statusCode: 200
    })
  })

  it.each([
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
      const mockError = {
        response: {
          data: { message: expectedError },
          status: statusCode
        }
      }
      const { sut, mockAxios } = makeSut()
      mockAxios.request = async () => {
        return Promise.resolve({
          data: { message: expectedError },
          status: statusCode
        })
      }

      const response = await sut.request(
        {
          url: 'https://example.com/api/resource',
          method: 'GET'
        },
        mockAxios
      )

      expect(response).toEqual({
        body: mockError.response.data,
        statusCode: mockError.response.status
      })
    }
  )
})
