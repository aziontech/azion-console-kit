import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadAccountService } from '@/services/accounts-management-services/load-account-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  accountSample: {
    id: 123,
    name: 'Teste',
    company_name: 'teste',
    is_active: true,
    unique_identifier: 'teste',
    is_social_login_enabled: false,
    is_enabled_mfa_to_all_users: false,
    company_size: null,
    job_function: null,
    country: 3469034,
    first_login: false,
    address: 'teste 123',
    complement: '',
    city: 3452925,
    postal_code: '911124433',
    region: 3451133,
    role: null,
    billing_emails: 'teste@azion.com',
    online_sales_region_id: null,
    is_online_reseller: false,
    code: '*--*',
    is_deleted: false,
    parent_id: 1234,
    account_type: 'group'
  }
}

const makeSut = () => {
  const sut = loadAccountService

  return { sut }
}

describe('AccountsManagementServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { data: [fixtures.accountSample] }
    })

    const { sut } = makeSut()
    await sut({ id: fixtures.accountSample.id })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/accounts/${fixtures.accountSample.id}`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: fixtures.accountSample
      }
    })

    const { sut } = makeSut()
    const result = await sut({ account_type: 'reseller' })

    expect(result).toEqual({
      accountName: fixtures.accountSample.name,
      accountType: fixtures.accountSample.account_type,
      address: fixtures.accountSample.address,
      billingEmails: fixtures.accountSample.billing_emails,
      city: fixtures.accountSample.city,
      clientId: fixtures.accountSample.client_id,
      companyName: fixtures.accountSample.company_name,
      companySize: null,
      complement: fixtures.accountSample.complement,
      country: fixtures.accountSample.country,
      firstLogin: fixtures.accountSample.first_login,
      id: fixtures.accountSample.id,
      isActive: fixtures.accountSample.is_active,
      isDeleted: fixtures.accountSample.is_deleted,
      isEnabledMfaToAllUsers: fixtures.accountSample.is_enabled_mfa_to_all_users,
      isSocialLoginEnabled: fixtures.accountSample.is_social_login_enabled,
      isTrustworthy: undefined,
      jobFunction: fixtures.accountSample.job_function,
      mapGroupId: undefined,
      parentId: fixtures.accountSample.parent_id,
      postalCode: fixtures.accountSample.postal_code,
      region: fixtures.accountSample.region,
      role: fixtures.accountSample.role,
      status: undefined,
      uniqueIdentifier: fixtures.accountSample.unique_identifier
    })
  })
})
