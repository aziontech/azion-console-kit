import { loadAccountJobRoleService } from '@/services/account-settings-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const makeSut = () => {
  const sut = loadAccountJobRoleService

  return {
    sut
  }
}

describe('AccountSettingsServices', () => {
  it('should call the API service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {}
      }
    })
    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: 'v4/iam/account'
    })
  })

  it('returns a valid job role on success request', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          job_function: 'software-developer'
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual({ jobRole: 'software-developer' })
  })

  it('returns correct job role on invalid and legacy roles with successfully request', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          job_function: 'invalid-job-role'
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual({ jobRole: 'other' })
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
        statusCode,
        body: { data: { job_function: 'stub-job-role' } }
      })
      const { sut } = makeSut()

      const request = sut()

      expect(request).rejects.toBe(expectedError)
    }
  )
})
