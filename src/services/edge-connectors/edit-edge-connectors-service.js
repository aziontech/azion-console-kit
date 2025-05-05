import { AxiosHttpClientAdapter } from '@services/axios/AxiosHttpClientAdapter'
import { makeEdgeConnectorsV4BaseUrl } from './make-edge-connectors-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const editEdgeConnectorsService = async (payload) => {
  const parsedPayload = adapt(payload)
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeConnectorsV4BaseUrl()}/${payload.id}`,
    method: 'PATCH',
    body: parsedPayload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    type: payload.type,
    modules: {
      origin_shield_enabled: payload.originShieldEnabled,
      load_balancer_enabled: payload.loadBalancerEnabled
    },
    active: payload.active,
    tls: {
      policy: payload.tlsPolicy
    },
    load_balance_method: payload.loadBalanceMethod,
    addresses: payload.addresses,
    connection_preference: payload.connectionPreference,
    connection_timeout: payload.connectionTimeout,
    read_write_timeout: payload.readWriteTimeout,
    max_retries: payload.maxRetries,
    type_properties: {
      ...payload.typeProperties,
      following_redirect: payload.typeProperties.followingRedirect,
      real_ip_header: payload.typeProperties.realIpHeader,
      real_port_header: payload.typeProperties.realPortHeader
    }
  }
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Edge Connectors has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
