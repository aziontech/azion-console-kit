import { AxiosHttpClientAdapter, parseHttpResponse } from '@services/axios/AxiosHttpClientAdapter'
import { makeEdgeConnectorsV4BaseUrl } from './make-edge-connectors-base-url'

export const loadEdgeConnectorsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeConnectorsV4BaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const data = httpResponse.body?.data
  const parsedEdgeConnectors = {
    id: data.id,
    type: data.type,
    name: data.name,
    loadBalancerEnabled: data.modules.load_balancer_enabled,
    originShieldEnabled: data.modules.origin_shield_enabled,
    addresses: data.addresses.map((el) => {
      return {
        address: el.address,
        plainPort: el.plain_port,
        tlsPort: el.tls_port,
        serverRole: el.server_role,
        weight: el.weight,
        active: el.active,
        maxConns: el.max_conns,
        maxFails: el.max_fails,
        failTimeout: el.fail_timeout
      }
    }),
    tlsPolicy: data.tls.policy,
    loadBalanceMethod: data.load_balance_method,
    connectionPreference: data.connection_preference,
    connectionTimeout: data.connection_timeout,
    readWriteTimeout: data.read_write_timeout,
    maxRetries: data.max_retries,
    active: data.active,
    typeProperties: {
      versions: data.type_properties.versions,
      host: data.type_properties.host,
      path: data.type_properties.path,
      followingRedirect: data.type_properties.following_redirect,
      realIpHeader: data.type_properties.real_ip_header,
      realPortHeader: data.type_properties.real_port_header
    }
  }

  return {
    body: parsedEdgeConnectors,
    statusCode: httpResponse.statusCode
  }
}
