import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createCacheSettingsService } from '@/services/edge-application-cache-settings-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  cacheSettingsMock: {
    edgeApplicationId: 3456789876,
    name: 'mockName',
    browserCacheSettings: 'mockBrowserCacheSettings',
    browserCacheSettingsMaximumTtl: 'mockBrowserCacheSettingsMaximumTtl',
    cdnCacheSettings: 'mockCdnCacheSettings',
    cdnCacheSettingsMaximumTtl: 'mockCdnCacheSettingsMaximumTtl',
    sliceConfigurationEnabled: false,
    sliceConfigurationRange: 'mockSliceConfigurationRange',
    cacheByQueryString: 'mockCacheByQueryString',
    queryStringFields: 'field1\nfield2\nfield3',
    enableQueryStringSort: false,
    enableCachingForPost: false,
    enableCachingForOptions: false,
    enableStaleCache: true,
    cacheByCookies: 'mockCacheByCookies',
    cookieNames: 'cookie1\ncookie2\ncookie3',
    adaptiveDeliveryAction: 'mockAdaptiveDeliveryAction',
    deviceGroup: [{ id: '123' }, { id: 456 }],
    l2CachingEnabled: false,
    isSliceL2CachingEnabled: false,
    isSliceEdgeCachingEnabled: false
  }
}
const makeSut = () => {
  const sut = createCacheSettingsService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServices', () => {
  it('should be able to call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut(fixtures.cacheSettingsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v4/edge_application/applications/${fixtures.cacheSettingsMock.edgeApplicationId}/cache_settings`,
      method: 'POST',
      body: {
        name: fixtures.cacheSettingsMock.name,
        browser_cache: {
          behavior: fixtures.cacheSettingsMock.browserCacheSettings,
          max_age: fixtures.cacheSettingsMock.browserCacheSettingsMaximumTtl
        },
        edge_cache: {
          behavior: fixtures.cacheSettingsMock.cdnCacheSettings,
          max_age: fixtures.cacheSettingsMock.cdnCacheSettingsMaximumTtl,
          caching_for_post_enabled: fixtures.cacheSettingsMock.enableCachingForPost,
          caching_for_options_enabled: fixtures.cacheSettingsMock.enableCachingForOptions,
          stale_cache_enabled: fixtures.cacheSettingsMock.enableStaleCache,
          tiered_cache_enabled: fixtures.cacheSettingsMock.l2CachingEnabled,
          tiered_cache_region: fixtures.cacheSettingsMock.l2CachingEnabled
            ? 'na-united-states'
            : undefined
        },
        application_controls: {
          cache_by_query_string: fixtures.cacheSettingsMock.cacheByQueryString,
          query_string_fields: ['field1', 'field2', 'field3'],
          query_string_sort_enabled: fixtures.cacheSettingsMock.enableQueryStringSort,
          cache_by_cookies: fixtures.cacheSettingsMock.cacheByCookies,
          cookie_names: ['cookie1', 'cookie2', 'cookie3'],
          adaptive_delivery_action: fixtures.cacheSettingsMock.adaptiveDeliveryAction,
          device_group: ['123', 456]
        },
        slice_controls: {
          slice_configuration_enabled: fixtures.cacheSettingsMock.sliceConfigurationEnabled,
          slice_edge_caching_enabled: fixtures.cacheSettingsMock.isSliceEdgeCachingEnabled,
          slice_tiered_caching_enabled: fixtures.cacheSettingsMock.isSliceL2CachingEnabled,
          slice_configuration_range: fixtures.cacheSettingsMock.sliceConfigurationRange
        }
      }
    })
  })

  it('should return a feedback when successfully create an cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.cacheSettingsMock)

    expect(result).toEqual({
      feedback: 'Cache Settings successfully created',
      cacheId: 1
    })
  })

  it('should parse each query string use to control content at a cache settings', async () => {
    const cacheSettingsMock = { ...fixtures.cacheSettingsMock, queryStringFields: '' }
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut(cacheSettingsMock)
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload.application_controls).toHaveProperty('query_string_fields', [])
  })

  it('should parse each cookie name used to control content at a cache settings', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut({ ...fixtures.cacheSettingsMock, cookieNames: '' })
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload.application_controls).toHaveProperty('cookie_names', [])
  })

  it('should parse correctly empty device group list', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201,
      body: {
        data: {
          id: 1
        }
      }
    })
    const { sut } = makeSut()

    await sut({ ...fixtures.cacheSettingsMock, deviceGroup: null })
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload.application_controls).toHaveProperty('device_group', [])
  })

  it('should throw parsing api error when request fails', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.cacheSettingsMock)

    expect(apiErrorResponse).rejects.toBe('api error message')
  })

  it('should throw internal server error when request fails with 500 status code', async () => {
    const apiErrorMock = {
      detail: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 500,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.cacheSettingsMock)
    const expectedError = new Errors.InternalServerError().message

    expect(apiErrorResponse).rejects.toBe(expectedError)
  })
})
