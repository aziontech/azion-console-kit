import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeApplicationBaseUrl } from '../../make-edge-application-base-url'

export const editOriginService = async (payload, id) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeApplicationBaseUrl()}/${id}/origins/${payload.originKey}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  let paylodAdapted = {
    name: payload.name,
    host_header: payload.hostHeader,
    addresses: payload.addresses,
    origin_path: payload.originPath,
    origin_protocol_policy: payload.originProtocolPolicy,
    hmac_authentication: payload.hmacAuthentication,
    hmac_region_name: payload.hmacRegionName,
    hmac_access_key: payload.hmacAccessKey,
    hmac_secret_key: payload.hmacSecretKey,
    connection_timeout: payload.connectionTimeout,
    timeout_between_bytes: payload.timeoutBetweenBytes,
  }

  if (payload.originType === 'load_balancer') {
    paylodAdapted =   {
      ...paylodAdapted,
      method: payload.method,
    }
  }

  paylodAdapted.addresses = payload.addresses.map(address => {
    return {
      ...address,
      weight: address.weight === null ? 1 : address.weight
    };
  });

  return paylodAdapted
}
