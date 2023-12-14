import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { createUsersService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  userMock: {
    firstName: 'John',
    lastName: 'Doe',
    selectedTimezone: 'America/New_York',
    selectedLanguage: 'en_US',
    email: 'johndoe@example.com',
    selectedCountry: { value: 'AF +93' },
    mobile: '+1-123-456-7890',
    userIsOwner: true,
    selectedTeam: 'Sales Team',
    twoFactorEnabled: true
  }
}

const makeSut = () => {
  const sut = createUsersService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()
    const version = 'v4'
    await sut(fixtures.userMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/users`,
      method: 'POST',
      body: {
        first_name: fixtures.userMock.firstName,
        last_name: fixtures.userMock.lastName,
        timezone: fixtures.userMock.selectedTimezone,
        language: fixtures.userMock.selectedLanguage,
        country_call_code: fixtures.userMock.selectedCountry.value,
        email: fixtures.userMock.email,
        mobile: fixtures.userMock.mobile,
        is_account_owner: fixtures.userMock.userIsOwner,
        teams_ids: fixtures.userMock.selectedTeam,
        two_factor_enabled: fixtures.userMock.twoFactorEnabled
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const data = await sut(fixtures.userMock)

    expect(data.feedback).toBe('Your user has been created')
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
