import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { loadCacheSettingsService } from '@/services/edge-application-cache-settings-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  edgeApplicationId: 4516528793898,
  cacheSettingsMock: {
    data: {
      id: 817236,
      name: 'mockName',
      browser_cache: {
        behavior: 'mockBrowserCacheSettings',
        max_age: 'mockBrowserCacheSettingsMaximumTtl'
      },
      edge_cache: {
        behavior: 'mockCdnCacheSettings',
        max_age: 'mockCdnCacheSettingsMaximumTtl',
        caching_for_post_enabled: false,
        caching_for_options_enabled: false,
        stale_cache_enabled: false,
        tiered_cache_enabled: false,
        tiered_cache_region: 'us-east-1'
      },
      slice_controls: {
        slice_configuration_enabled: false,
        slice_edge_caching_enabled: false,
        slice_tiered_caching_enabled: false,
        slice_configuration_range: 'mockSliceConfigurationRange'
      },
      application_controls: {
        cache_by_query_string: 'mockCacheByQueryString',
        query_string_sort_enabled: false,
        cache_by_cookies: 'mockCacheByCookies',
        cookie_names: [],
        query_string_fields: [],
        adaptive_delivery_action: 'mockAdaptiveDeliveryAction',
        device_group: null
      }
    }
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
      body: fixtures.cacheSettingsMock
    })

    const { sut } = makeSut()
    await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.data.id
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.edgeApplicationId}/cache_settings/${fixtures.cacheSettingsMock.data.id}`,
      method: 'GET'
    })
  })

  it('should parse each returned device group', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          ...fixtures.cacheSettingsMock.data,
          application_controls: {
            ...fixtures.cacheSettingsMock.data.application_controls,
            device_group: [123, 456]
          }
        }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.data.id
    })

    expect(results.deviceGroup).toEqual([{ id: 123 }, { id: 456 }])
  })

  it('should parse each cookie name in cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          ...fixtures.cacheSettingsMock.data,
          application_controls: {
            ...fixtures.cacheSettingsMock.data.application_controls,
            cookie_names: ['cookieName1', 'cookieName2']
          }
        }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.data.id
    })

    expect(results.cookieNames).toEqual('cookieName1\ncookieName2')
  })

  it('should parse each query string in cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        data: {
          ...fixtures.cacheSettingsMock.data,
          application_controls: {
            ...fixtures.cacheSettingsMock.data.application_controls,
            query_string_fields: ['queryString1', 'queryString2']
          }
        }
      }
    })

    const { sut } = makeSut()
    const results = await sut({
      edgeApplicationId: fixtures.edgeApplicationId,
      id: fixtures.cacheSettingsMock.data.id
    })

    expect(results.queryStringFields).toEqual('queryString1\nqueryString2')
  })
})
