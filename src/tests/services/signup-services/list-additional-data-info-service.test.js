import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listAdditionalDataInfoService } from '@/services/signup-services'

const makeSut = () => {
  const sut = listAdditionalDataInfoService

  return {
    sut
  }
}

describe('ListAdditionalDataInfoService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'iam/additional_data',
      method: 'GET'
    })
  })

  it('should return correct data on success', async () => {
    const mockResponse = {
      statusCode: 200,
      body: {
        job_functions: [
          {
            label: 'Developer',
            value: 'developer',
            order: 1
          },
          {
            label: 'DevOps',
            value: 'devops',
            order: 2
          }
        ],
        company_sizes: [
          {
            label: 'Just me',
            value: '1:1',
            order: 1
          },
          {
            label: '2 - 99 employees',
            value: '2:99',
            order: 2
          }
        ]
      }
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(mockResponse)
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(mockResponse.body)
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
