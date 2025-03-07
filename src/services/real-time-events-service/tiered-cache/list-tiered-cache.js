import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'

export const listTieredCache = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

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
      'clientId',
      'source'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.l2CacheEvents?.map((tieredCacheEvents) => ({
    configurationId: tieredCacheEvents.configurationId,
    source: tieredCacheEvents.source,
    host: tieredCacheEvents.host,
    proxyHost: tieredCacheEvents.proxyHost,
    id: generateCurrentTimestamp(),
    summary: buildSummary(tieredCacheEvents),
    ts: tieredCacheEvents.ts,
    tsFormat: convertValueToDate(tieredCacheEvents.ts)
  }))

  return {
    data
  }
}
