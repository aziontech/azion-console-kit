import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  response: {
    body: {
      results: [
        {
          name: 'Test',
          id: 1
        }
      ],
      total_pages: 1
    },
    statusCode: 201
  },
  mockFilter: {
    type: 'brands',
    textSnippet: '',
    page: 1,
    page_size: 5
  }
}

const makeSut = () => {
  const sut = listTypeAccountService

  return {
    sut
  }
}

describe('UsersServices', () => {
  it('should call API with correct params', async () => {
    const requestSpy = vi
      .spyOn(AxiosHttpClientAdapter, 'request')
      .mockResolvedValueOnce(fixtures.response)
    const { sut } = makeSut()

    await sut(fixtures.mockFilter)

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `switch-account?account_type=${fixtures.mockFilter.type}&q=${fixtures.mockFilter.textSnippet}&page=${fixtures.mockFilter.page}&page_size=${fixtures.mockFilter.page_size}`
    })
  })

  it('should return a feedback message on successfully created', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce(fixtures.response)

    const { sut } = makeSut()

    const feedbackMessage = await sut(fixtures.mockFilter)

    expect(feedbackMessage).toBe('Resource successfully created')
  })
})
