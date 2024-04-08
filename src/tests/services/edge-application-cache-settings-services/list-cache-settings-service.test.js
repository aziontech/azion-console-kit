import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listCacheSettingsService } from '@/services/edge-application-cache-settings-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 1920763586747,
  cacheSettingsMock: {
    id: '181729637',
    name: 'Cache Settings Console Kit',
    browser_cache_settings: 'honor',
    cdn_cache_settings: 'override'
  }
}

const makeSut = () => {
  const sut = listCacheSettingsService

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
      url: `v3/edge_applications/${fixtures.edgeApplicationId}/cache_settings?page_size=200`,
      method: 'GET'
    })
  })

  it('should parse each cache settings correctly', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: [fixtures.cacheSettingsMock]
      }
    })

    const { sut } = makeSut()
    const result = await sut({
      id: fixtures.edgeApplicationId
    })

    expect(result).toEqual([
      {
        id: fixtures.cacheSettingsMock.id,
        name: fixtures.cacheSettingsMock.name,
        browserCache: 'Honor Origin Cache Headers',
        cdnCache: 'Override Cache Settings'
      }
    ])
  })
})
