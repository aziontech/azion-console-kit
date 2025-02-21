import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { getRecordsFound } from '@/helpers/get-records-found'
import { buildSummary } from '@/helpers'

export const listHttpRequest = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
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
    fields: ['configurationId', 'host', 'requestId','httpUserAgent', 'requestMethod', 'status', 'ts', 'upstreamBytesSent', 'sslProtocol', 'wafLearning', 'requestTime'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}


const adaptResponse = (httpResponse) => {
  const { body } = httpResponse
  const totalRecords = body.data.httpEvents?.length

  const data = body.data.httpEvents?.map((httpEventItem) => ({
    id: generateCurrentTimestamp(),
    summary: buildSummary(httpEventItem),
    tsFormat: convertValueToDate(httpEventItem.ts)
  }))

  return {
    data,
    recordsFound: getRecordsFound(totalRecords)
  }
}
