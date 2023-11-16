import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { putAdditionalDataService } from '@/services/signup-services'

const additionalDataPayloadMock = {
  project_type_selection: 'type1',
  company_name: 'Test Company',
  company_size: '1-10',
  country: '1'
}

const makeSut = () => {
  const sut = putAdditionalDataService

  return {
    sut
  }
}

describe('SignupServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(additionalDataPayloadMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'account/info',
      method: 'PUT',
      body: additionalDataPayloadMock
    })
  })

  it('should not return a feedback message on successfully sent', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const req = await sut(additionalDataPayloadMock)

    expect(req).toBeNull()
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

      const request = sut(additionalDataPayloadMock)

      expect(request).rejects.toBe(expectedError)
    }
  )
})
