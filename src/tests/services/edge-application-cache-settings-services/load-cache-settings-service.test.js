import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadCacheSettingsService } from '@/services/edge-application-cache-settings-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 4516528793898,
  cacheSettingsMock: {
    id: 817236,
    name: 'mockName',
    browser_cache_settings: 'mockBrowserCacheSettings',
    browser_cache_settings_maximum_ttl: 'mockBrowserCacheSettingsMaximumTtl',
    cdn_cache_settings: 'mockCdnCacheSettings',
    cdn_cache_settings_maximum_ttl: 'mockCdnCacheSettingsMaximumTtl',
    is_slice_configuration_enabled: false,
    slice_configuration_range: 'mockSliceConfigurationRange',
    cache_by_query_string: 'mockCacheByQueryString',
    enable_query_string_sort: false,
    enable_caching_for_post: false,
    enable_caching_for_options: false,
    enable_stale_cache: false,
    cache_by_cookies: 'mockCacheByCookies',
    cookie_names: [],
    query_string_fields: [],
    adaptive_delivery_action: 'mockAdaptiveDeliveryAction',
    device_group: null
  }
}

const makeSut = () => {
  const sut = loadCacheSettingsService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: fixtures.cacheSettingsMock
      }
    })

    const { sut } = makeSut()
    await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.edgeApplicationId}/cache_settings/${fixtures.cacheSettingsMock.id}`,
      method: 'GET'
    })
  })

  it('should parse each returned device group', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: { ...fixtures.cacheSettingsMock, device_group: [123, 456] }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.id
    })

    expect(results.deviceGroup).toEqual([
      {
        id: 123
      },
      { id: 456 }
    ])
  })

  it('should parse each cookie name in cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: { ...fixtures.cacheSettingsMock, cookie_names: ['cookieName1', 'cookieName2'] }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.id
    })

    expect(results.cookieNames).toEqual('cookieName1\ncookieName2')
  })

  it('should parse each query string in cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        results: {
          ...fixtures.cacheSettingsMock,
          query_string_fields: ['queryString1', 'queryString2']
        }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.id
    })

    expect(results.queryStringFields).toEqual('queryString1\nqueryString2')
  })
})
