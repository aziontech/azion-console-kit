import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'
import { getCurrentTimezone } from '@/helpers'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

const DATASET = 'workloadEvents'

// All 58 workloadEvents fields split into two chunks (≤30 each + join keys).
// `requestId` + `ts` in both for reliable merge.
const FIELDS_CHUNK_A = [
  'requestId',
  'ts',
  'bytesSent',
  'configurationId',
  'debugLog',
  'geolocAsn',
  'geolocCountryName',
  'geolocRegionName',
  'host',
  'httpReferer',
  'httpUserAgent',
  'proxyStatus',
  'requestLength',
  'requestMethod',
  'requestTime',
  'requestUri',
  'remoteAddress',
  'remotePort',
  'scheme',
  'serverProtocol',
  'sentHttpContentType',
  'sentHttpXOriginalImageSize',
  'sessionid',
  'serverAddr',
  'serverPort',
  'solutionId',
  'sslCipher',
  'sslProtocol',
  'sslServerName',
  'sslSessionReused'
]

const FIELDS_CHUNK_B = [
  'requestId',
  'ts',
  'stacktrace',
  'status',
  'streamname',
  'tcpinfoRtt',
  'upstreamAddr',
  'upstreamAddrStr',
  'upstreamBytesReceived',
  'upstreamBytesReceivedStr',
  'upstreamBytesSent',
  'upstreamBytesSentStr',
  'upstreamCacheStatus',
  'upstreamConnectTime',
  'upstreamConnectTimeStr',
  'upstreamHeaderTime',
  'upstreamHeaderTimeStr',
  'upstreamResponseTime',
  'upstreamResponseTimeStr',
  'upstreamStatus',
  'upstreamStatusStr',
  'virtualhostId',
  'wafAttackFamily',
  'wafBlock',
  'wafEvheaders',
  'wafLearning',
  'wafMatch',
  'wafScore',
  'wafTotalBlocked',
  'wafTotalProcessed'
]

// ── DEV MOCK ────────────────────────────────────────────────────────────
const USE_MOCK =
  import.meta.env.MODE === 'development' && import.meta.env.VITE_ENVIRONMENT !== 'production'

const spreadTimestamps = (events) => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000
  return events.map((event, index) => {
    const fraction = index / (events.length - 1 || 1)
    const ts = new Date(fiveMinutesAgo + fraction * (now - fiveMinutesAgo)).toISOString()
    return { ...event, ts }
  })
}

const loadMockData = async () => {
  const mod = await import('./__mocks__/events.json')
  const raw = mod.default || mod
  const events = spreadTimestamps(raw.data.httpEvents)
  return { data: { httpEvents: events } }
}

const adaptMockResponse = (httpResponse) => {
  let counter = 0
  const data = httpResponse.data.httpEvents?.map((httpEventItem) => ({
    id: `mock_${Date.now()}_${counter++}`,
    requestId: httpEventItem.requestId,
    summary: buildSummary(httpEventItem, shouldLimitRequestUri, shouldShowTsColumn),
    ts: httpEventItem.ts,
    tsFormat: getCurrentTimezone(httpEventItem.ts)
  }))
  return { data }
}
// ── END DEV MOCK ────────────────────────────────────────────────────────

export const listHttpRequest = async (filter, { onQuery } = {}) => {
  if (USE_MOCK) {
    const body = await loadMockData()
    return adaptMockResponse(body)
  }

  const decorator = new AxiosHttpClientSignalDecorator()
  const makeRequest = (fields) => {
    const payload = adapt(filter, fields)
    if (typeof onQuery === 'function') {
      onQuery(payload)
    }
    return decorator.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body: payload
    })
  }

  const [responseA, responseB] = await Promise.all([
    makeRequest(FIELDS_CHUNK_A),
    makeRequest(FIELDS_CHUNK_B)
  ])

  // Both must succeed
  if (responseA.statusCode !== 200) return parseHttpResponse(responseA)
  if (responseB.statusCode !== 200) return parseHttpResponse(responseB)

  const rowsA = responseA.body.data?.[DATASET] || []
  const rowsB = responseB.body.data?.[DATASET] || []

  // Merge by requestId — both queries use the same filter + ordering so
  // rows arrive in the same order. Build a Map from chunk B for O(1) lookup.
  const chunkBByRequestId = new Map(rowsB.map((row) => [row.requestId, row]))

  // In-place merge: assign chunk B fields directly onto chunk A row objects
  // to avoid spread-copying every row.
  for (let i = 0; i < rowsA.length; i++) {
    const rowA = rowsA[i]
    const rowB =
      rowsB[i]?.requestId === rowA.requestId
        ? rowsB[i]
        : chunkBByRequestId.get(rowA.requestId)
    if (rowB) {
      for (const key in rowB) {
        if (key !== 'requestId' && key !== 'ts') {
          rowA[key] = rowB[key]
        }
      }
    }
  }

  return adaptResponse({ data: { [DATASET]: rowsA } })
}

const adapt = (filter, fields) => {
  const table = {
    dataset: DATASET,
    limit: filter?.pageSize || 1000,
    ...(filter?.offset && { offset: filter.offset }),
    fields,
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (httpResponse) => {
  const data = httpResponse.data[DATASET]?.map((workloadEventItem) => ({
    id: generateCurrentTimestamp(),
    requestId: workloadEventItem.requestId,
    summary: buildSummary(workloadEventItem, shouldLimitRequestUri, shouldShowTsColumn),
    ts: workloadEventItem.ts,
    tsFormat: getCurrentTimezone(workloadEventItem.ts)
  }))

  return { data }
}

const parseHttpResponse = (response) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return adaptResponse(body)
    case 400:
      const apiError = body.detail
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const forbiddenError = body.detail
      throw new Error(forbiddenError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
