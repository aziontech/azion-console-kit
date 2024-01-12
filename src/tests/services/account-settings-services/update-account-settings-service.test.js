import { updateAccountSettingsService } from '@/services/account-settings-services'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { describe, expect, it, vi } from 'vitest'
import * as Errors from '@/services/axios/errors'

const fixtures = {
  accountSettingsMock: {
    accountName: 'New Account Name',
    companyName: 'New Company Name',
    uniqueIdentifier: 'new-unique-identifier',
    billingEmails: 'newbilling@example.com',
    postalCode: '12345',
    country: '12345',
    region: '45678',
    city: '67890',
    address: 'New Address',
    complement: 'New Complement',
    isSocialLoginEnabled: true,
    isEnabledMfaToAllUsers: true
  }
}

const makeSut = () => {
  const sut = updateAccountSettingsService

  return {
    sut
  }
}

describe('AccountSettingsServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    await sut(fixtures.accountSettingsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/iam/account',
      method: 'PATCH',
      body: {
        name: fixtures.accountSettingsMock.accountName,
        company_name: fixtures.accountSettingsMock.companyName,
        unique_identifier: fixtures.accountSettingsMock.uniqueIdentifier,
        billing_emails: fixtures.accountSettingsMock.billingEmails,
        postal_code: fixtures.accountSettingsMock.postalCode,
        country: fixtures.accountSettingsMock.country,
        region: fixtures.accountSettingsMock.region,
        city: fixtures.accountSettingsMock.city,
        address: fixtures.accountSettingsMock.address,
        complement: fixtures.accountSettingsMock.complement,
        is_social_login_enabled: fixtures.accountSettingsMock.isSocialLoginEnabled,
        is_enabled_mfa_to_all_users: fixtures.accountSettingsMock.isEnabledMfaToAllUsers
      }
    })
  })

  it('should return a feedback message on successfully updated', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200
    })
    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.accountSettingsMock)

    expect(feedbackMessage).toBe('Your account settings have been updated')
  })

  it('Should return an API error for an 400 error status', async () => {
    const apiErrorMock = 'Invalid API request'
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: {
        results: [apiErrorMock]
      }
    })
    const { sut } = makeSut()

    const feedbackMessage = sut(fixtures.accountSettingsMock)

    expect(feedbackMessage).rejects.toBe(apiErrorMock)
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
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })
      const { sut } = makeSut()

      const response = sut(fixtures.accountSettingsMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
