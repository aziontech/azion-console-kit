import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  userMock: [{ name: 'John Doe', id: 1 }],
  totalPagesMock: 1,
  mockFilter: {
    type: 'brands',
    textSnippet: '',
    page: 1,
    pageSize: 5
  }
}

const makeSut = () => {
  const sut = listTypeAccountService

  return {
    sut
  }
}

describe('Switch-account-services', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      body: { results: [], total_pages: 1 },
      statusCode: 201
    })

    const { sut } = makeSut()

    await sut(fixtures.mockFilter)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `switch-account?account_type=${fixtures.mockFilter.type}&q=${fixtures.mockFilter.textSnippet}&page=${fixtures.mockFilter.page}&page_size=${fixtures.mockFilter.pageSize}`
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: fixtures.userMock, total_pages: fixtures.totalPagesMock }
    })

    const { sut } = makeSut()

    const result = await sut(fixtures.mockFilter)

    expect(result).toEqual({
      results: [
        {
          accountId: '1',
          clientID: '-',
          id: '1',
          name: {
            content: 'John Doe'
          },
          type: {
            content: 'Brand',
            icon: 'pi pi-globe',
            severity: 'info'
          }
        }
      ],
      totalPages: 1
    })
  })
})
