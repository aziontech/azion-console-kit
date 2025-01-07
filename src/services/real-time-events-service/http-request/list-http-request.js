import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate, userUsingGraphqlQuery } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'

export const listHttpRequest = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: userUsingGraphqlQuery(filter) ?? payload
  })

  return adaptResponse(httpResponse)
}

const adapt = (filter) => {
  const table = {
    dataset: 'httpEvents',
    limit: 10000,
    fields: ['configurationId', 'host', 'requestId', 'requestUri', 'requestMethod', 'status', 'ts'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse

  return body.data.httpEvents?.map((httpEventItem) => ({
    id: generateCurrentTimestamp(),
    configurationId: httpEventItem.configurationId,
    host: httpEventItem.host,
    requestId: httpEventItem.requestId,
    requestUri: httpEventItem.requestUri,
    requestMethod: httpEventItem.requestMethod,
    status: httpEventItem.status,
    ts: httpEventItem.ts,
    tsFormat: convertValueToDate(httpEventItem.ts)
  }))
}
