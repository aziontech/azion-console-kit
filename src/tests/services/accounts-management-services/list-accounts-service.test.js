import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  accountSample: {
    id: 123,
    name: 'teste',
    is_active: true,
    company_name: 'teste'
  }
}

const makeSut = () => {
  const sut = listAccountsService

  return { sut }
}

describe('AccountsManagementServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })

    const { sut } = makeSut()
    await sut({ account_type: 'reseller' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/accounts?account_type=reseller&ordering=id&page=1&page_size=10`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.accountSample]
      }
    })

    const { sut } = makeSut()
    const result = await sut({ account_type: 'reseller' })

    expect(result).toEqual([
      {
        id: fixtures.accountSample.id,
        name: fixtures.accountSample.name,
        company: fixtures.accountSample.company_name,
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })
})
