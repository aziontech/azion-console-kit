import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from './make-edge-application-base-url'

export const createEdgeApplicationService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    delivery_protocol: payload.deliveryProtocol,
    http3: false,
    http_port: payload.httpPort.value.value,
    https_port: payload.httpsPort.value,
    minimum_tls_version: payload.minimumTlsVersion.value,
    origin_type: payload.originType.value,
    address: payload.address,
    origin_protocol_policy: payload.originProtocolPolicy,
    host_header: payload.hostHeader,
    browser_cache_settings: payload.browserCacheSettings,
    browser_cache_settings_maximum_ttl: payload.browserCacheSettingsMaximumTtl
      ? payload.browserCacheSettingsMaximumTtl
      : 0,
    cdn_cache_settings: payload.cdnCacheSettings,
    cdn_cache_settings_maximum_ttl: payload.cdnCacheSettingsMaximumTtl
  }
}
