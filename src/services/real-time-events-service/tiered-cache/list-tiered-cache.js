import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'

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

  return parseHttpResponse(response)
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
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const data = response.data.l2CacheEvents?.map((tieredCacheEvents) => ({
    configurationId: tieredCacheEvents.configurationId,
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
