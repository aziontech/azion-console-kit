import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listEdgeCacheService } from '@/services/edge-application-edge-cache-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 1920763586747,
  edgeCacheMock: {
    id: '181729637',
    name: 'Cache Settings Console Kit',
    browser_cache_settings: true,
    cdn_cache_settings: false
  }
}

const makeSut = () => {
  const sut = listEdgeCacheService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: []
      }
    })

    const { sut } = makeSut()
    await sut({
      id: fixtures.edgeApplicationId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.edgeApplicationId}/cache_settings`,
      method: 'GET'
    })
  })

  it('should parse each cache settings correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.edgeCacheMock]
      }
    })

    const { sut } = makeSut()
    const result = await sut({
      id: fixtures.edgeApplicationId
    })

    expect(result).toEqual([
      {
        id: fixtures.edgeCacheMock.id,
        name: fixtures.edgeCacheMock.name,
        browserCache: fixtures.edgeCacheMock.browser_cache_settings,
        cdnCache: fixtures.edgeCacheMock.cdn_cache_settings
      }
    ])
  })
})
