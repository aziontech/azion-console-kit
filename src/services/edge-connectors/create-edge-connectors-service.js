import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeConnectorsV4BaseUrl } from './make-edge-connectors-base-url'
import * as Errors from '@/services/axios/errors'
import { extractApiError } from '@/helpers/extract-api-error'

export const createEdgeConnectorsService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeEdgeConnectorsV4BaseUrl(),
    method: 'POST',
    body: adapt(payload)
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

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The formatted error message.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return { feedback: 'Edge Connectors successfully created', urlToEditView: '/edge-connectors' }
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
