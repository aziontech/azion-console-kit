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

const extractAddresses = (addresses) => {
  return addresses.map((address) => {
    return {
      address: address.address,
      plain_port: address.plainPort,
      tls_port: address.tlsPort,
      server_role: address.serverRole,
      weight: address.weight,
      active: address.active,
      max_conns: address.maxConns,
      max_fails: address.maxFails,
      fail_timeout: address.failTimeout
    }
  })
}

const adapt = (payload) => {
  const typeBuilders = {
    live_ingest: () => ({
      type_properties: { endpoint: payload.liveIngestEndpoint }
    }),
    s3: () => ({
      addresses: extractAddresses(payload.addresses),
      type_properties: {
        host: payload.s3.host,
        bucket: payload.s3.bucket,
        path: payload.s3.path,
        region: payload.s3.region,
        access_key: payload.s3.accessKey,
        secret_key: payload.s3.secretKey
      }
    }),
    edge_storage: () => ({
      type_properties: {
        bucket: payload.edgeStorage.bucket,
        prefix: payload.edgeStorage.prefix
      }
    }),
    http: () => ({
      addresses: extractAddresses(payload.addresses),
      type_properties: {
        versions: payload.http.versions,
        host: payload.http.host,
        path: payload.http.path,
        following_redirect: payload.http.followingRedirect,
        real_ip_header: payload.http.realIpHeader,
        real_port_header: payload.http.realPortHeader
      }
    })
  }

  const buildProperties = typeBuilders[payload.type] || (() => ({}))

  return {
    name: payload.name,
    type: payload.type,
    modules: {
      origin_shield_enabled: payload.originShieldEnabled,
      load_balancer_enabled: payload.loadBalancerEnabled
    },
    active: payload.status,
    tls: {
      policy: payload.tlsPolicy
    },
    load_balance_method: payload.loadBalanceMethod,
    connection_preference: payload.connectionPreference,
    connection_timeout: payload.connectionTimeout,
    read_write_timeout: payload.readWriteTimeout,
    max_retries: payload.maxRetries,
    ...buildProperties()
  }
}

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return 'Edge Connector has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}
