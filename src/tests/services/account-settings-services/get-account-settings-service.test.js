import { describe, expect, it, vi } from 'vitest'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { getAccountSettingsService } from '@/services/account-settings-services/get-account-settings-service'

const fixtures = {
  response: {
    name: 'account name',
    id: '1234',
    company_name: 'company name',
    unique_identifier: 'unique identifier',
    billing_emails: 'billing emails',
    postal_code: 'postal code',
    country: '1234',
    region: '3421',
    city: '6578',
    address: 'address',
    complement: 'complement',
    is_social_login_enabled: true,
    is_enabled_mfa_to_all_users: true
  },
  formattedResponse: {
    accountName: 'account name',
    clientId: '1234',
    companyName: 'company name',
    uniqueIdentifier: 'unique identifier',
    billingEmails: 'billing emails',
    postalCode: 'postal code',
    country: '1234',
    region: '3421',
    city: '6578',
    address: 'address',
    complement: 'complement',
    isSocialLoginEnabled: true,
    isEnabledMfaToAllUsers: true
  }
}

const makeSut = () => {
  const sut = getAccountSettingsService

  return {
    sut
  }
}

describe('getAccountSettingsService', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.response
      }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: 'v4/iam/account',
      method: 'GET'
    })
  })

  it('should return account settings on success', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.response
      }
    })

    const { sut } = makeSut()

    const accountSettings = await sut()

    expect(accountSettings).toEqual(fixtures.formattedResponse)
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
