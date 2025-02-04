import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../edge-application-services/make-edge-application-base-url'

export const loadOriginService = async ({ edgeApplicationId, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${edgeApplicationId}/origins/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const origin = httpResponse.body?.results
  const parsedBody = {
    originId: origin.origin_id,
    originKey: origin.origin_key,
    name: origin.name,
    originType: origin.origin_type,
    addresses: origin.addresses?.map((address) => ({
      address: address.address,
      weight: address.weight,
      serverRole: address.server_role,
      isActive: address.is_active
    })),
    streamingEndpoint: origin.streaming_endpoint,
    originProtocolPolicy: origin.origin_protocol_policy,
    isOriginRedirectionEnabled: origin.is_origin_redirection_enabled,
    hostHeader: origin.host_header,
    method: origin.method,
    originPath: origin.origin_path,
    connectionTimeout: origin.connection_timeout,
    timeoutBetweenBytes: origin.timeout_between_bytes,
    hmacAuthentication: origin.hmac_authentication,
    hmacRegionName: origin.hmac_region_name,
    hmacAccessKey: origin.hmac_access_key,
    hmacSecretKey: origin.hmac_secret_key,
    bucketName: origin.bucket,
    prefix: origin.prefix
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
