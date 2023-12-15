import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editUsersService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  userMock: {
    firstName: 'test',
    lastName: 'test',
    timezone: 'GTM',
    language: 'en',
    countryCallCode: '',
    email: 'testt@azion.com',
    mobile: '',
    twoFactorEnabled: false
  }
}

const makeSut = () => {
  const sut = editUsersService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.userMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/user`,
      method: 'PATCH',
      body: {
        first_name: fixtures.userMock.firstName,
        last_name: fixtures.userMock.lastName,
        email: fixtures.userMock.email,
        language: fixtures.userMock.language,
        timezone: fixtures.userMock.timezone,
        country_call_code: fixtures.userMock.countryCallCode,
        mobile: fixtures.userMock.mobile?.toString(),
        two_factor_enabled: fixtures.userMock.twoFactorEnabled
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.userMock)

    expect(data).toBe('Your user has been updated')
  })

  it.each([
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

      const response = sut(fixtures.userMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
