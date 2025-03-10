import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'

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

  return adaptResponse(httpResponse)
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
  const { body } = httpResponse

  const data = body.data.httpEvents?.map((httpEventItem) => ({
    id: generateCurrentTimestamp(),
    configurationId: httpEventItem.configurationId,
    requestId: httpEventItem.requestId,
    summary: buildSummary(httpEventItem),
    ts: httpEventItem.ts,
    tsFormat: convertValueToDate(httpEventItem.ts)
  }))

  return {
    data
  }
}
