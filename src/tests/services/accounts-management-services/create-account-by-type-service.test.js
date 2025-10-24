import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createAccountByTypeService } from '@/services/accounts-management-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  accountMock: {
    address: '123 Test Street',
    accountName: 'Test Account',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company',
    isActive: true,
    uniqueIdentifier: '1234567890',
    complement: 'Suite 100',
    city: 'Test City',
    postalCode: '12345',
    role: 'admin'
  },
  emailErrorMock: {
    user: {
      email: ['Email already in use']
    }
  },
  errorMock: {
    firstKey: 'First Error Message',
    secondKey: 'Second Error Message'
  }
}
const makeSut = () => {
  const sut = createAccountByTypeService

  return {
    sut
  }
}

describe('AccountManagementServices', () => {
  it('should call API with correct params with type', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()
    const accountType = 'client'
    await sut(fixtures.accountMock, accountType)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'POST',
      url: `iam/accounts`,
      body: {
        account_type: accountType,
        address: '123 Test Street',
        billing_emails: undefined,
        city: 'Test City',
        company_name: 'Test Company',
        company_size: undefined,
        complement: 'Suite 100',
        currency_iso_code: 'BRL',
        first_login: undefined,
        is_active: true,
        is_enabled_mfa_to_all_users: undefined,
        is_social_login_enabled: undefined,
        is_trustworthy: undefined,
        job_function: undefined,
        map_group_id: undefined,
        name: 'Test Account',
        parent_id: undefined,
        postal_code: '12345',
        role: 'admin',
        status: undefined,
        terms_of_service_url: 'https://www.azion.com/en/documentation/agreements/tos/',
        unique_identifier: '1234567890',
        user: {
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User'
        }
      }
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })

    const { sut } = makeSut()
    const accountType = 'client'

    const { feedback } = await sut(fixtures.accountMock, accountType)

    expect(feedback).toBe('Account saved.')
  })

  it('should parse correctly the feedback message when the error is a string inside an object', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: fixtures.emailErrorMock
    })
    const { sut } = makeSut()
    const accountType = 'client'

    const response = sut(fixtures.accountMock, accountType)

    expect(response).rejects.toThrow(fixtures.emailErrorMock.user.email[0])
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
      const accountType = 'client'

      const response = sut(fixtures.accountMock, accountType)

      expect(response).rejects.toBe(expectedError)
    }
  )
})

it('should parse correctly the feedback message when the error is the first key', async () => {
  vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
    statusCode: 400,
    body: fixtures.errorMock
  })
  const { sut } = makeSut()
  const accountType = 'client'

  const response = sut(fixtures.accountMock, accountType)

  expect(response).rejects.toThrow(fixtures.errorMock.firstKey)
})
