import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listAdditionalDataInfoService } from '@/services/signup-services'

const mockResponse = {
  raw: {
    results: [
      {
        id: 1,
        key: 'Question 1?',
        required: true,
        show: true,
        values: [
          {
            id: 1,
            value: 'Option 1',
            other_values: false
          },
          {
            id: 2,
            value: 'Option 2',
            other_values: false
          }
        ]
      }
    ]
  },
  formatted: [
    {
      id: 1,
      key: 'Question 1?',
      required: true,
      show: true,
      values: [
        {
          id: 1,
          value: 'Option 1',
          other_values: false
        },
        {
          id: 2,
          value: 'Option 2',
          other_values: false
        }
      ]
    },
    {
      id: 10,
      key: 'Full Name',
      required: true,
      show: false
    }
  ]
}

const makeSut = () => {
  const sut = listAdditionalDataInfoService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockResponse.raw
    })

    const { sut } = makeSut()
    const version = 'v4'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/additional_data/v2`,
      method: 'GET'
    })
  })

  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockResponse.raw
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(mockResponse.formatted)
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new Errors.InvalidApiRequestError().message
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

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
