import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'

export const listHttpRequest = async (filter) => {
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
    dataset: 'httpEvents',
    limit: 10000,
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
  const data = httpResponse.data.httpEvents?.map((httpEventItem) => ({
    id: generateCurrentTimestamp(),
    requestId: httpEventItem.requestId,
    summary: buildSummary(httpEventItem),
    ts: httpEventItem.ts,
    tsFormat: convertValueToDate(httpEventItem.ts)
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
