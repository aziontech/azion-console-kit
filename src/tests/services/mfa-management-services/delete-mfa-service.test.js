import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { deleteMfaService } from '@/services/mfa-management-services/delete-mfa-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  id: '123456789'
}

const makeSut = () => {
  const sut = deleteMfaService

  return { sut }
}

describe('MfaManagementServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    await sut(fixtures.id)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/auth/mfa/totp/${fixtures.id}`,
      method: 'DELETE'
    })
  })

  it('should return a feedback message on successfully deleted', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })

    const { sut } = makeSut()
    const feedback = await sut(fixtures.id)

    expect(feedback).toBe('MFA successfully deleted')
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.id)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.id)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
