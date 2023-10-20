import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { getAccountDetailedService } from '@/services/users-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  results: {
    account_type: 'client',
    address: '',
    billing_emails: 'herbert.julio+pk@azion.com',
    city_id: null,
    client_id: '7454t',
    company_name: '',
    company_size: null,
    complement: '',
    country_id: null,
    first_login: true,
    id: 2752,
    is_active: true,
    is_deleted: false,
    is_enabled_mfa_to_all_users: false,
    is_social_login_enabled: false,
    is_trustworthy: false,
    job_function: null,
    map_group_id: null,
    name: 'herbert ',
    parent_id: 231,
    postal_code: '',
    region_id: null,
    role: null,
    status: 'TRIAL',
    unique_identifier: ''
  }
}

const makeSut = () => {
  const sut = getAccountDetailedService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: null
      }
    })

    const { sut } = makeSut()

    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `account-details`,
      method: 'GET'
    })
  })

  it('should parsed correctly each detailed account', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: fixtures.results
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual(fixtures.results)
  })
})
