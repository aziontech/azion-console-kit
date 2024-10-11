import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listCacheSettingsService } from '@/services/edge-application-cache-settings-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 1920763586747,
  cacheSettingsMock: {
    id: '0',
    name: 'string',
    browser_cache: {
      behavior: 'honor',
      max_age: 0
    },
    edge_cache: {
      behavior: 'honor',
      max_age: 0,
      caching_for_post_enabled: true,
      caching_for_options_enabled: true,
      stale_cache_enabled: true,
      tiered_cache_enabled: true,
      tiered_cache_region: 'string'
    },
    application_controls: {
      cache_by_query_string: 'ignore',
      query_string_fields: ['string'],
      query_string_sort_enabled: true,
      cache_by_cookies: 'ignore',
      cookie_names: ['string'],
      adaptive_delivery_action: 'ignore',
      device_group: [0]
    },
    slice_controls: {
      slice_configuration_enabled: true,
      slice_edge_caching_enabled: true,
      slice_tiered_caching_enabled: true,
      slice_configuration_range: 1024
    }
  }
}

const makeSut = () => {
  const sut = listCacheSettingsService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServicesV4', () => {
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
      url: `v4/edge_application/applications/1920763586747/cache_settings?ordering=name&page=1&page_size=200&fields=&search=undefined`,
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
        cdnCache: 'Honor Origin Cache Headers'
      }
    ])
  })
})
