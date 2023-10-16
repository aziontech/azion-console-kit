import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPersonalTokens } from '@/services/personal-tokens-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  personalTokenMock: {
    uuid: 123123123,
    name: 'Network A',
    created: new Date(2023, 10, 10).toDateString(),
    expires_at: new Date(2023, 11, 10).toDateString()
  }
}

const makeSut = () => {
  const sut = listPersonalTokens

  return {
    sut
  }
}

describe('PersonalTokensServices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.personalTokenMock]
      }
    })

    const { sut } = makeSut()

    await sut({ pageSize: 400, search: 'search_text' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/personal_tokens?page_size=400&search=search_text`,
      method: 'GET'
    })
  })

  it('should parsed correctly each personal token', async () => {
    vi.setSystemTime(new Date(2023, 10, 10, 10))
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.personalTokenMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut({})

    expect(result).toEqual([
      {
        id: fixtures.personalTokenMock.uuid,
        scope: 'Global',
        name: fixtures.personalTokenMock.name,
        created: 'Friday, November 10, 2023',
        expiresAt: 'Sunday, December 10, 2023'
      }
    ])
  })
})
