import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'

export const listImageProcessor = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'imagesProcessedEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'host',
      'requestUri',
      'status',
      'bytesSent',
      'httpReferer',
      'httpUserAgent',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.imagesProcessedEvents?.map((imagesProcessedEvents) => ({
    id: generateCurrentTimestamp(),
    configurationId: imagesProcessedEvents.configurationId,
    host: imagesProcessedEvents.host,
    requestUri: imagesProcessedEvents.requestUri,
    status: imagesProcessedEvents.status,
    bytesSent: imagesProcessedEvents.bytesSent,
    httpReferer: imagesProcessedEvents.httpReferer,
    httpUserAgent: imagesProcessedEvents.httpUserAgent,
    ts: imagesProcessedEvents.ts,
    tsFormat: convertValueToDate(imagesProcessedEvents.ts)
  }))

  return {
    data
  }
}
