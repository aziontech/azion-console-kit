import { convertGQL } from '@/helpers/convert-gql'
import { convertValueToDate } from '@/helpers/convert-date'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

export const loadHttpRequest = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(httpResponse)
}

const adapt = (filter) => {
  const table = {
    dataset: 'httpEvents',
    limit: 10000,
    fields: [
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
    orderBy: 'ts_ASC'
  }

  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts,
      requestIdEq: filter.requestId
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse
  const [httpEventItem = {}] = body.data.httpEvents
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
    source: httpEventItem.source,
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
    serverProtocol: httpEventItem.serverProtocol
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
