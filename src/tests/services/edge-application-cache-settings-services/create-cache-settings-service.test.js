import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { createCacheSettingsService } from '@/services/edge-application-cache-settings-services'
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
    cacheByCookies: 'mockCacheByCookies',
    cookieNames: 'cookie1\ncookie2\ncookie3',
    adaptiveDeliveryAction: 'mockAdaptiveDeliveryAction',
    deviceGroup: [{ id: '123' }, { id: 456 }]
  }
}
const makeSut = () => {
  const sut = createCacheSettingsService

  return { sut }
}

describe('EdgeApplicationCacheSettingsServices', () => {
  it('should be able to call Api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(fixtures.cacheSettingsMock)

    expect(requestSpy).toHaveBeenCalledWith({
      url: `v3/edge_applications/${fixtures.cacheSettingsMock.edgeApplicationId}/cache_settings`,
      method: 'POST',
      body: {
        name: fixtures.cacheSettingsMock.name,
        browser_cache_settings: fixtures.cacheSettingsMock.browserCacheSettings,
        browser_cache_settings_maximum_ttl:
          fixtures.cacheSettingsMock.browserCacheSettingsMaximumTtl,
        cdn_cache_settings: fixtures.cacheSettingsMock.cdnCacheSettings,
        cdn_cache_settings_maximum_ttl: fixtures.cacheSettingsMock.cdnCacheSettingsMaximumTtl,
        is_slice_configuration_enabled: fixtures.cacheSettingsMock.sliceConfigurationEnabled,
        slice_configuration_range: fixtures.cacheSettingsMock.sliceConfigurationRange,
        cache_by_query_string: fixtures.cacheSettingsMock.cacheByQueryString,
        query_string_fields: ['field1', 'field2', 'field3'],
        enable_query_string_sort: fixtures.cacheSettingsMock.enableQueryStringSort,
        enable_caching_for_post: fixtures.cacheSettingsMock.enableCachingForPost,
        enable_caching_for_options: fixtures.cacheSettingsMock.enableCachingForOptions,
        enable_stale_cache: true,
        cache_by_cookies: fixtures.cacheSettingsMock.cacheByCookies,
        cookie_names: ['cookie1', 'cookie2', 'cookie3'],
        adaptive_delivery_action: fixtures.cacheSettingsMock.adaptiveDeliveryAction,
        device_group: ['123', 456]
      }
    })
  })

  it('should return a feedback when successfully create an cache settings', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    const result = await sut(fixtures.cacheSettingsMock)

    expect(result).toEqual({
      feedback: 'Cache Settings successfully created'
    })
  })

  it('should parse each query string use to control content at a cache settings', async () => {
    const cacheSettingsMock = { ...fixtures.cacheSettingsMock, queryStringFields: '' }
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut(cacheSettingsMock)
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload).toHaveProperty('query_string_fields', [])
  })

  it('should parse each cookie name used to control content at a cache settings', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut({ ...fixtures.cacheSettingsMock, cookieNames: '' })
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload).toHaveProperty('cookie_names', [])
  })

  it('should parse correctly empty device group list', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 201
    })
    const { sut } = makeSut()

    await sut({ ...fixtures.cacheSettingsMock, deviceGroup: null })
    const apiRequestPayload = requestSpy.mock.lastCall[0].body

    expect(apiRequestPayload).toHaveProperty('device_group', [])
  })

  it('should throw when request fails with statusCode 400', async () => {
    const apiErrorMock = {
      error: 'api error message'
    }

    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 400,
      body: apiErrorMock
    })

    const { sut } = makeSut()

    const apiErrorResponse = sut(fixtures.cacheSettingsMock)

    expect(apiErrorResponse).rejects.toBe('error: api error message')
  })

  it.each([
    {
      statusCode: 401,
      expectedError: new Errors.InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new Errors.PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new Errors.NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new Errors.InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new Errors.UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode
      })

      const { sut } = makeSut()

      const response = sut(fixtures.cacheSettingsMock)

      expect(response).rejects.toBe(expectedError)
    }
  )
})
