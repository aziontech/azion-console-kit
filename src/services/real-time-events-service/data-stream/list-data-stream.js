import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'

export const listDataStream = async (filter) => {
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

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'dataStreamedEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'jobName',
      'endpointType',
      'url',
      'statusCode',
      'ts',
      'dataStreamed',
      'streamedLines'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    configurationId: dataStreamedEvents.configurationId,
    id: generateCurrentTimestamp(),
    summary: buildSummary(dataStreamedEvents),
    ts: dataStreamedEvents.ts,
    tsFormat: convertValueToDate(dataStreamedEvents.ts)
  }))

  return {
    data
  }
}
