import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const createOriginService = async (payload, id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/origins`,
    method: 'POST',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    host_header: payload.hostHeader,
    method: payload.method,
    addresses: payload.addresses,
    origin_path: payload.originPath,
    origin_protocol_policy: payload.originProtocolPolicy,
    hmac_authentication: payload.hmacAuthentication,
    hmac_region_name: payload.hmacRegionName,
    hmac_access_key: payload.hmacAccessKey,
    hmac_secret_key: payload.hmacSecretKey,
    connection_timeout: payload.connectionTimeout,
    timeout_between_bytes: payload.timeoutBetweenBytes
  }
}
