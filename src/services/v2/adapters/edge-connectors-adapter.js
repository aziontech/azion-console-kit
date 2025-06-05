import { getCurrentTimezone } from '@/helpers'
import { parseStatusData } from '../utils/adapter/parse-status-utils'

const extractAddressesPostRequest = (addresses) => {
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

const extractAddressesLoadRequest = (addresses) => {
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

const typeBuilders = {
  live_ingest: (payload) => ({
    type_properties: {
      endpoint: payload.liveIngestEndpoint
    }
  }),

  s3: (payload) => ({
    addresses: extractAddressesPostRequest(payload.addresses),
    type_properties: {
      host: payload.s3.host,
      bucket: payload.s3.bucket,
      path: payload.s3.path,
      region: payload.s3.region,
      access_key: payload.s3.accessKey,
      secret_key: payload.s3.secretKey
    }
  }),

  edge_storage: (payload) => ({
    type_properties: {
      bucket: payload.edgeStorage.bucket,
      prefix: payload.edgeStorage.prefix
    }
  }),

  http: (payload) => ({
    addresses: extractAddressesPostRequest(payload.addresses),
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

const typeBuildersLoadRequest = {
  live_ingest: (data) => ({
    liveIngestEndpoint: data.type_properties.endpoint
  }),
  s3: (data) => ({
    addresses: extractAddressesLoadRequest(data.addresses),
    s3: {
      host: data.type_properties.host,
      bucket: data.type_properties.bucket,
      path: data.type_properties.path,
      region: data.type_properties.region,
      accessKey: data.type_properties.access_key,
      secretKey: data.type_properties.secret_key
    }
  }),
  edge_storage: (data) => ({
    edgeStorage: {
      bucket: data.type_properties.bucket,
      prefix: data.type_properties.prefix
    }
  }),
  http: (data) => ({
    addresses: extractAddressesLoadRequest(data.addresses),
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

const buildTypePayload = (type, payload, action) => {
  const builder = action === 'POST' ? typeBuilders[type] : typeBuildersLoadRequest[type]
  return builder(payload)
}

export const EdgeConnectorsAdapter = {
  transformListEdgeConnectors(data) {
    return (
      data?.map((edgeConnectors) => {
        return {
          id: edgeConnectors.id,
          name: edgeConnectors.name,
          type: edgeConnectors?.type,
          header: edgeConnectors?.type_properties?.real_port_header,
          address: edgeConnectors?.addresses
            ? edgeConnectors?.addresses
                .map((el) => {
                  return el.address
                })
                .join(',')
            : [],
          active: edgeConnectors?.active
            ? parseStatusData(edgeConnectors.active)
            : edgeConnectors?.active,
          lastEditor: edgeConnectors?.last_editor,
          lastModified: edgeConnectors?.last_modified
            ? getCurrentTimezone(edgeConnectors.last_modified)
            : edgeConnectors?.last_modified
        }
      }) || []
    )
  },
  transformPayloadEdgeConnectors(payload) {
    const builder = buildTypePayload(payload.type, payload, 'POST')

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
      ...builder
    }
  },
  transformLoadEdgeConnectors({ data }) {
    const builder = buildTypePayload(data.type, data, 'GET')

    return {
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
      ...builder
    }
  }
}
