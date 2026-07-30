import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'
import { getCurrentTimezone } from '@/helpers'

const shouldShowTsColumn = true

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
  ['serverAddr', 'serverPort', 'wafEvheaders']
]

const mergeHttpEvents = (responses) => {
  // O(n) collect+unwrap (fix C9): the previous reduce did `[].concat(acc[key], value)`
  // per repeated key, which is O(n²) when a key recurs across events. Gather all
  // values per key into buckets first (preserving first-seen key order), then unwrap
  // to a scalar when a key occurred once and to an ordered array when it repeated —
  // byte-equivalent to the old concat behavior for the happy path (disjoint chunks).
  const buckets = {}
  responses
    .flatMap((res) => res.body?.data?.workloadEvents || [])
    .forEach((event) => {
      Object.entries(event).forEach(([key, value]) => {
        if (buckets[key]) {
          buckets[key].push(value)
        } else {
          buckets[key] = [value]
        }
      })
    })

  const merged = {}
  Object.keys(buckets).forEach((key) => {
    const bucket = buckets[key]
    merged[key] = bucket.length === 1 ? bucket[0] : [].concat(...bucket)
  })
  return merged
}

const createPayload = (filter, fields) => {
  return convertGQL(
    {
      tsRange: filter.tsRange,
      and: { tsEq: filter.ts, requestIdEq: filter.requestId }
    },
    {
      dataset: 'workloadEvents',
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
  const ts = httpEventItem.ts
  const adapt = {
    httpReferer: httpEventItem.httpReferer,
    scheme: httpEventItem.scheme?.toUpperCase(),
    ts,
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
    serverPort: httpEventItem.serverPort,
    wafEvheaders: { content: httpEventItem.wafEvheaders, type: 'clipboard' }
  }

  return {
    host: adapt.host,
    ts: getCurrentTimezone(adapt.ts),
    requestId: adapt.requestId,
    remoteAddress: adapt.remoteAddress,
    remotePort: adapt.remotePort,
    scheme: adapt.scheme,
    data: buildSummary(adapt, false, shouldShowTsColumn)
  }
}
