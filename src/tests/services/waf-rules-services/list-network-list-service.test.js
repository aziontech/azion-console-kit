import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listNetworkListService } from '@/services/waf-rules-services'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = {
  networkMock: {
    id: 123123123,
    name: 'Network AZ'
  }
}

const makeSut = () => {
  const sut = listNetworkListService

  return {
    sut
  }
}

describe('WafRulesServices', () => {
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
        results: null
      }
    })

    const { sut } = makeSut()
    await sut()

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/workspace/network_lists?page_size=100`,
      method: 'GET'
    })
  })

  it('should parsed correctly each network record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.networkMock]
      }
    })
    const { sut } = makeSut()

    const result = await sut()

    expect(result).toEqual([
      {
        name: fixtures.networkMock.name,
        value: {
          id: fixtures.networkMock.id,
          disabledCountries: false,
          disabledIP: false
        }
      }
    ])
  })
})
