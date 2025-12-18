import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listPersonalTokens } from '@/services/personal-tokens-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const localeMock = (locale = 'en') => {
  const DateTimeFormat = Intl.DateTimeFormat
  vi.spyOn(window.global.Intl, 'DateTimeFormat')
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
    .mockImplementationOnce((__, options) => DateTimeFormat(locale, { ...options }))
}

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
    const version = 'v4'
    await sut({ pageSize: 400, search: 'search_text' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/iam/personal_tokens?page_size=400&search=search_text`,
      method: 'GET'
    })
  })

  it('should parsed correctly each personal token', async () => {
    localeMock()
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
        description: '',
        name: fixtures.personalTokenMock.name,
        createdDate: 'Fri Nov 10 2023',
        expiresAt: 'December 10, 2023 at 12:00:00 AM',
        lastModified: 'November 10, 2023 at 12:00:00 AM',
        lastModify: '10 hours ago',
        expiresAtDate: 'Sun Dec 10 2023'
      }
    ])
  })
})
