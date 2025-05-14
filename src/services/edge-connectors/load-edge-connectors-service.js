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

const extractAddresses = (addresses) => {
  return addresses.map((address) => {
    return {
      address: address.address,
      plainPort: address.plain_port,
      tlsPort: address.tls_port,
      serverRole: address.server_role,
      weight: address.weight,
      active: address.active,
      maxConns: address.max_conns,
      maxFails: address.max_fails,
      failTimeout: address.fail_timeout
    }
  })
}

const adapt = (httpResponse) => {
  const data = httpResponse.body?.data
  const typeBuilders = {
    live_ingest: () => ({
      liveIngestEndpoint: data.type_properties.liveIngestEndpoint
    }),
    s3: () => ({
      addresses: extractAddresses(data.addresses),
      s3: {
        host: data.type_properties.host,
        bucket: data.type_properties.bucket,
        path: data.type_properties.path,
        region: data.type_properties.region,
        accessKey: data.type_properties.access_key,
        secretKey: data.type_properties.secret_key
      }
    }),
    edge_storage: () => ({
      edgeStorage: {
        bucket: data.type_properties.bucket,
        prefix: data.type_properties.prefix
      }
    }),
    http: () => ({
      addresses: extractAddresses(data.addresses),
      http: {
        versions: data.type_properties.versions,
        host: data.type_properties.host,
        path: data.type_properties.path,
        followingRedirect: data.type_properties.following_redirect,
        realIpHeader: data.type_properties.real_ip_header,
        realPortHeader: data.type_properties.real_port_header
      }
    })
  }

  const buildProperties = typeBuilders[data.type] || (() => ({}))

  const parsedEdgeConnectors = {
    id: data.id,
    type: data.type,
    name: data.name,
    loadBalancerEnabled: data.modules.load_balancer_enabled,
    originShieldEnabled: data.modules.origin_shield_enabled,
    tlsPolicy: data.tls.policy,
    loadBalanceMethod: data.load_balance_method,
    connectionPreference: data.connection_preference,
    connectionTimeout: data.connection_timeout,
    readWriteTimeout: data.read_write_timeout,
    maxRetries: data.max_retries,
    status: data.active,
    ...buildProperties()
  }

  return {
    body: parsedEdgeConnectors,
    statusCode: httpResponse.statusCode
  }
}
