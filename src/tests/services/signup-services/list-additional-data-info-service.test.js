import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { listAdditionalDataInfoService } from '@/services/signup-services'

const mockResponse = {
  jobFunctions: [
    {
      label: 'job',
      value: 'job',
      order: 1
    }
  ],
  companySizes: [
    {
      label: 'company',
      value: 'company',
      order: 1
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
      body: mockResponse
    })

    const { sut } = makeSut()
    const version = 'v3'
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/additional_data`,
      method: 'GET'
    })
  })

  it('should return correct data on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: mockResponse
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(mockResponse)
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
