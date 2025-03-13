import { convertGQL } from '@/helpers/convert-gql'
import { convertValueToDate } from '@/helpers/convert-date'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

const fieldsByRequest = [
  [
    'httpReferer',
    'scheme',
    'ts',
    'httpUserAgent',
    'remoteAddress',
    'host',
    'remotePort',
    'upstreamBytesReceived',
    'configurationId',
    'requestTime',
    'requestLength',
    'bytesSent',
    'upstreamResponseTime',
    'sentHttpContentType',
    'requestId',
    'sslCipher',
    'requestMethod',
    'upstreamBytesSent',
    'requestUri',
    'sslProtocol',
    'upstreamAddr',
    'upstreamStatus',
    'status',
    'wafScore',
    'wafTotalProcessed',
    'wafTotalBlocked',
    'wafLearning',
    'wafBlock',
    'debugLog',
    'wafMatch',
    'geolocAsn',
    'stacktrace',
    'geolocCountryName',
    'geolocRegionName',
    'upstreamCacheStatus',
    'serverProtocol'
  ],
  ['serverAddr', 'serverPort']
]

const mergeHttpEvents = (responses) => {
  return responses
    .flatMap((res) => res.body?.data?.httpEvents || [])
    .reduce((acc, event) => {
      Object.entries(event).forEach(([key, value]) => {
        acc[key] = acc[key] ? [].concat(acc[key], value) : value
      })
      return acc
    }, {})
}

const createPayload = (filter, fields) => {
  return convertGQL(
    {
      tsRange: filter.tsRange,
      and: { tsEq: filter.ts, requestIdEq: filter.requestId }
    },
    {
      dataset: 'httpEvents',
      limit: 10000,
      fields,
      orderBy: 'ts_ASC'
    }
  )
}

export const loadHttpRequest = async (filter) => {
  const decorator = new AxiosHttpClientSignalDecorator()

  const requests = fieldsByRequest.map((fields) =>
    decorator.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body: createPayload(filter, fields)
    })
  )

  const httpResponses = await Promise.all(requests)
  return adaptResponse(mergeHttpEvents(httpResponses))
}

const adaptResponse = (httpEventItem) => {
  const adapt = {
    httpReferer: httpEventItem.httpReferer,
    scheme: httpEventItem.scheme?.toUpperCase(),
    ts: convertValueToDate(httpEventItem.ts),
    httpUserAgent: httpEventItem.httpUserAgent,
    remoteAddress: httpEventItem.remoteAddress,
    host: httpEventItem.host,
    remotePort: httpEventItem.remotePort,
    upstreamBytesReceived: httpEventItem.upstreamBytesReceived,
    upstreamBytesSent: httpEventItem.upstreamBytesSent,
    upstreamAddr: httpEventItem.upstreamAddr,
    upstreamStatus: httpEventItem.upstreamStatus,
    upstreamResponseTime: httpEventItem.upstreamResponseTime,
    wafTotalProcessed: httpEventItem.wafTotalProcessed,
    configurationId: httpEventItem.configurationId,
    requestTime: httpEventItem.requestTime,
    tcpinfoRtt: httpEventItem.tcpinfoRtt,
    requestLength: httpEventItem.requestLength,
    bytesSent: httpEventItem.bytesSent,
    sentHttpContentType: httpEventItem.sentHttpContentType,
    requestId: httpEventItem.requestId,
    sslCipher: httpEventItem.sslCipher,
    requestMethod: httpEventItem.requestMethod,
    requestUri: httpEventItem.requestUri,
    sslProtocol: httpEventItem.sslProtocol,
    status: httpEventItem.status,
    wafScore: httpEventItem.wafScore,
    wafTotalBlocked: httpEventItem.wafTotalBlocked,
    wafLearning: httpEventItem.wafLearning,
    wafBlock: httpEventItem.wafBlock,
    debugLog: httpEventItem.debugLog,
    wafMatch: httpEventItem.wafMatch,
    geolocAsn: httpEventItem.geolocAsn,
    stacktrace: httpEventItem.stacktrace,
    geolocCountryName: httpEventItem.geolocCountryName,
    geolocRegionName: httpEventItem.geolocRegionName,
    upstreamCacheStatus: httpEventItem.upstreamCacheStatus,
    serverProtocol: httpEventItem.serverProtocol,
    serverAddr: httpEventItem.serverAddr,
    serverPort: httpEventItem.serverPort
  }

  return {
    host: adapt.host,
    ts: adapt.ts,
    requestId: adapt.requestId,
    remoteAddress: adapt.remoteAddress,
    remotePort: adapt.remotePort,
    scheme: adapt.scheme,
    data: buildSummary(adapt)
  }
}
