import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { editAnotherUserService } from '@/services/users-services'
import * as Errors from '@/services/axios/errors'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  userMock: {
    id: 4462,
    firstName: 'test name',
    lastName: 'test last name',
    timezone: 'GMT',
    language: 'en',
    email: 'test.test@azion.com',
    countryCallCode: '355',
    mobile: 12312312,
    isAccountOwner: false,
    teamsIds: [1580],
    twoFactorEnabled: false
  }
}

const makeSut = () => {
  const sut = editAnotherUserService

  return {
    sut
  }
}

describe('UsersService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.userMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/iam/users/${fixtures.userMock.id}`,
      method: 'PATCH',
      body: {
        first_name: fixtures.userMock.firstName,
        last_name: fixtures.userMock.lastName,
        timezone: fixtures.userMock.timezone,
        language: fixtures.userMock.language,
        email: fixtures.userMock.email,
        country_call_code: fixtures.userMock.countryCallCode,
        mobile: fixtures.userMock.mobile.toString(),
        is_account_owner: fixtures.userMock.isAccountOwner,
        teams_ids: fixtures.userMock.teamsIds,
        two_factor_enabled: fixtures.userMock.twoFactorEnabled
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.userMock)

    expect(feedbackMessage).toBe('Your user has been updated')
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
  it('should throw first api error when request fails with status code 400', async () => {
    const expectedError = 'user with this Email already exists.'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: { email: [expectedError] }
    })
    const { sut } = makeSut()

    const response = sut(fixtures.userMock)

    expect(response).rejects.toBe(expectedError)
  })
})
