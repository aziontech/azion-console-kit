import { getCurrentTimezone } from '@/helpers'
import { parseStatusData } from '../utils/adapter/parse-status-utils'

const extractAddressesPostRequest = (addresses, loaderBalancerIsEnabled) => {
  return addresses.map((address) => {
    return {
      active: address?.active,
      address: address?.address,
      http_port: address?.plainPort,
      https_port: address?.tlsPort,
      modules: loaderBalancerIsEnabled
        ? {
            load_balancer: {
              server_role: address?.serverRole,
              weight: address?.weight
            }
          }
        : null
    }
  })
}

const extractAddressesLoadRequest = (addresses) => {
  return addresses.map((address) => {
    return {
      active: address.active,
      address: address.address,
      plainPort: address.http_port,
      tlsPort: address.https_port,
      serverRole: address.modules?.load_balancer?.server_role,
      weight: address.modules?.load_balancer?.weight
    }
  })
}

const typeBuilders = {
  live_ingest: (payload) => ({
    region: payload.connectionOptions.region
  }),

  edge_storage: (payload) => ({
    bucket: payload.connectionOptions.bucket,
    prefix: payload.connectionOptions.prefix
  }),

  http: (payload) => {
    const modules = {
      origin_shield: {
        enabled: payload.modules.originShield.enabled,
        config: payload.modules.originShield.enabled
          ? {
              origin_ip_acl: {
                enabled: payload.modules.originShield.config.originIpAcl.enabled
              },
              hmac: {
                enabled: payload.modules.originShield.config.hmac.enabled,
                config: {
                  type: payload.modules.originShield.config.hmac.config.type,
                  attributes: {
                    region: payload.modules.originShield.config.hmac.config.attributes.region,
                    service: payload.modules.originShield.config.hmac.config.attributes.service,
                    access_key:
                      payload.modules.originShield.config.hmac.config.attributes.accessKey,
                    secret_key: payload.modules.originShield.config.hmac.config.attributes.secretKey
                  }
                }
              }
            }
          : null
      },
      load_balancer: {
        enabled: payload.modules.loadBalancer.enabled,
        config: payload.modules.loadBalancer.enabled
          ? {
              method: payload.modules.loadBalancer.config.method,
              max_retries: payload.modules.loadBalancer.config.maxRetries,
              connection_timeout: payload.modules.loadBalancer.config.connectionTimeout,
              read_write_timeout: payload.modules.loadBalancer.config.readWriteTimeout
            }
          : null
      }
    }

    const shouldSendModules =
      payload.modules.originShield.enabled || payload.modules.loadBalancer.enabled

    const result = {
      addresses: extractAddressesPostRequest(
        payload.addresses,
        payload.modules.loadBalancer.enabled
      ),
      connection_options: {
        dns_resolution: payload.connectionOptions.dnsResolution,
        transport_policy: payload.connectionOptions.transportPolicy,
        host: payload.connectionOptions.host,
        path_prefix: payload.connectionOptions.pathPrefix,
        following_redirect: payload.connectionOptions.followingRedirect,
        real_ip_header: payload.connectionOptions.realIpHeader,
        real_port_header: payload.connectionOptions.realPortHeader
      }
    }

    if (shouldSendModules) {
      result.modules = modules
    }

    return result
  }
}

const typeBuildersLoadRequest = {
  live_ingest: (data) => ({
    connectionOptions: {
      region: data.attributes.region
    }
  }),

  edge_storage: (data) => ({
    connectionOptions: {
      bucket: data.attributes.bucket,
      prefix: data.attributes.prefix
    }
  }),

  http: (data) => ({
    connectionOptions: {
      dnsResolution: data.attributes.connection_options.dns_resolution,
      transportPolicy: data.attributes.connection_options.transport_policy,
      host: data.attributes.connection_options.host,
      pathPrefix: data.attributes.connection_options.path_prefix,
      realIpHeader: data.attributes.connection_options.real_ip_header,
      realPortHeader: data.attributes.connection_options.real_port_header,
      followingRedirect: data.attributes.connection_options.following_redirect
    },
    modules: {
      loadBalancer: {
        enabled: data.attributes.modules.load_balancer.enabled,
        config: {
          method: data.attributes.modules.load_balancer?.config?.method,
          maxRetries: data.attributes.modules.load_balancer?.config?.max_retries,
          connectionTimeout: data.attributes.modules.load_balancer?.config?.connection_timeout,
          readWriteTimeout: data.attributes.modules.load_balancer?.config?.read_write_timeout
        }
      },
      originShield: {
        enabled: data.attributes.modules.origin_shield_enabled,
        config: {
          originIpAcl: {
            enabled: data.attributes.modules.origin_ip_acl?.enabled
          },
          hmac: {
            enabled: data.attributes.modules.hmac?.enabled,
            config: {
              type: data.attributes.modules.hmac?.config?.type,
              attributes: {
                region: data.attributes.modules.hmac?.config?.attributes?.region,
                service: data.attributes.modules.hmac?.config?.attributes?.service,
                accessKey: data.attributes.modules.hmac?.config?.attributes?.access_key,
                secretKey: data.attributes.modules.hmac?.config?.attributes?.secret_key
              }
            }
          }
        }
      }
    },
    addresses: extractAddressesLoadRequest(data.attributes.addresses)
  })
}

const edgeConnectorsTypes = {
  http: 'HTTP',
  edge_storage: 'Edge Storage',
  live_ingest: 'Live Ingest'
}

export const EdgeConnectorsAdapter = {
  transformListEdgeConnectors(data) {
    return (
      data?.map((edgeConnectors) => {
        return {
          id: edgeConnectors.id,
          name: edgeConnectors.name,
          type: edgeConnectorsTypes[edgeConnectors?.type],
          header: edgeConnectors?.attributes?.connection_options?.host || '-',
          address: edgeConnectors?.attributes?.addresses
            ? edgeConnectors?.attributes?.addresses
                .map((el) => {
                  return el.address
                })
                .join(', ')
            : '-',
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
    const builder = typeBuilders[payload.type]
    const attributes = builder(payload)

    return {
      name: payload.name,
      type: payload.type,
      active: payload.active,
      attributes
    }
  },

  transformLoadEdgeConnectors({ data }) {
    const builder = typeBuildersLoadRequest[data.type]
    const attributes = builder(data)

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      active: data.active,
      ...attributes
    }
  }
}
