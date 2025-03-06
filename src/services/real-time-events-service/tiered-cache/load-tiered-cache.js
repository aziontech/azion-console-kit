import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

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
    scheme: l2CacheEvents.scheme?.toUpperCase(),
    proxyHost: l2CacheEvents.proxyHost,
    ts: convertValueToDate(l2CacheEvents.ts),
    serverProtocol: l2CacheEvents.serverProtocol?.toUpperCase(),
    data: buildSummary(l2CacheEvents)
  }
}
