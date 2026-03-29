import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
// eslint-disable-next-line azion-architecture/services-http-only
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'
import { getCurrentTimezone } from '@/helpers'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

// ── DEV MOCK ────────────────────────────────────────────────────────────
// Use VITE_ENVIRONMENT (not MODE) so that production-targeted local dev
// sessions hit the real GraphQL API instead of the mock JSON.
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

export const listHttpRequest = async (filter) => {
  if (USE_MOCK) {
    const body = await loadMockData()
    return adaptMockResponse(body)
  }

  const payload = adapt(filter)
  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (filter) => {
  const table = {
    dataset: 'workloadEvents',
    limit: 1000,
    fields: [
      'configurationId',
      'host',
      'requestId',
      'httpUserAgent',
      'requestMethod',
      'status',
      'ts',
      'upstreamBytesSent',
      'sslProtocol',
      'wafLearning',
      'requestUri',
      'requestTime',
      'serverProtocol',
      'upstreamCacheStatus',
      'httpReferer',
      'remoteAddress',
      'wafMatch',
      'serverPort',
      'sslCipher',
      'wafEvheaders',
      'serverAddr',
      'scheme'
    ],
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (httpResponse) => {
  const data = httpResponse.data.workloadEvents?.map((workloadEventItem) => ({
    id: generateCurrentTimestamp(),
    requestId: workloadEventItem.requestId,
    summary: buildSummary(workloadEventItem, shouldLimitRequestUri, shouldShowTsColumn),
    ts: workloadEventItem.ts,
    tsFormat: getCurrentTimezone(workloadEventItem.ts)
  }))

  return {
    data
  }
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
