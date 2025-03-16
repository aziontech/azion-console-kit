import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { convertValueToDateByUserTimezone } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'
import { getUserTimezone } from '../get-timezone'

export const loadTieredCache = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    baseURL: '/',
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
      'clientId'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts,
      hostEq: filter.host,
      proxyHostEq: filter.proxyHost
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [l2CacheEvents = {}] = body.data.l2CacheEvents
  const timezone = getUserTimezone()

  return {
    scheme: l2CacheEvents.scheme?.toUpperCase(),
    proxyHost: l2CacheEvents.proxyHost,
    ts: convertValueToDateByUserTimezone(l2CacheEvents.ts, timezone),
    serverProtocol: l2CacheEvents.serverProtocol?.toUpperCase(),
    data: buildSummary(l2CacheEvents)
  }
}
