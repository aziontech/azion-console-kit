import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const loadTieredCache = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'l2CacheEvents',
    limit: 10000,
    fields: [
      'bytesSent',
      'cacheKey',
      'cacheTtl',
      'configurationId',
      'host',
      'proxyHost',
      'proxyStatus',
      'proxyUpstream',
      'referenceError',
      'remoteAddr',
      'remotePort',
      'requestLength',
      'requestMethod',
      'requestTime',
      'requestUri',
      'scheme',
      'sentHttpContentType',
      'serverProtocol',
      'solution',
      'status',
      'tcpinfoRtt',
      'ts',
      'upstreamBytesReceived',
      'upstreamBytesReceivedStr',
      'upstreamCacheStatus',
      'upstreamConnectTime',
      'upstreamHeaderTime',
      'upstreamResponseTime',
      'upstreamStatus',
      'clientId',
      'source'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts,
      sourceEq: filter.source,
      hostEq: filter.host,
      proxyHostEq: filter.proxyHost
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [l2CacheEvents = {}] = body.data.l2CacheEvents

  return {
    bytesSent: l2CacheEvents.bytesSent,
    cacheKey: l2CacheEvents.cacheKey,
    cacheTtl: l2CacheEvents.cacheTtl,
    configurationId: l2CacheEvents.configurationId,
    host: l2CacheEvents.host,
    clientId: l2CacheEvents.clientId,
    proxyHost: l2CacheEvents.proxyHost,
    proxyStatus: l2CacheEvents.proxyStatus,
    proxyUpstream: l2CacheEvents.proxyUpstream,
    referenceError: l2CacheEvents.referenceError,
    remoteAddr: l2CacheEvents.remoteAddr,
    remotePort: l2CacheEvents.remotePort,
    requestLength: l2CacheEvents.requestLength,
    requestMethod: l2CacheEvents.requestMethod,
    requestTime: l2CacheEvents.requestTime,
    requestUri: l2CacheEvents.requestUri,
    scheme: l2CacheEvents.scheme?.toUpperCase(),
    sentHttpContentType: l2CacheEvents.sentHttpContentType,
    serverProtocol: l2CacheEvents.serverProtocol?.toUpperCase(),
    solution: l2CacheEvents.solution,
    status: l2CacheEvents.status,
    tcpinfoRtt: l2CacheEvents.tcpinfoRtt,
    ts: convertValueToDate(l2CacheEvents.ts),
    upstreamBytesReceived: l2CacheEvents.upstreamBytesReceived,
    upstreamBytesReceivedStr: l2CacheEvents.upstreamBytesReceivedStr,
    upstreamCacheStatus: l2CacheEvents.upstreamCacheStatus,
    upstreamConnectTime: l2CacheEvents.upstreamConnectTime,
    upstreamHeaderTime: l2CacheEvents.upstreamHeaderTime,
    upstreamResponseTime: l2CacheEvents.upstreamResponseTime,
    upstreamStatus: l2CacheEvents.upstreamStatus,
    source: l2CacheEvents.source
  }
}
