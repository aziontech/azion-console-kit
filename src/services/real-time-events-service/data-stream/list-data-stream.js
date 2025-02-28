import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { getRecordsFound } from '@/helpers/get-records-found'
import { buildSummary } from '@/helpers'

export const listDataStream = async (filter) => {
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
      'source',
      'streamedLines'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const totalRecords = body.data.dataStreamedEvents?.length

  const data = body.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    configurationId: dataStreamedEvents.configurationId,
    id: generateCurrentTimestamp(),
    summary: buildSummary(dataStreamedEvents),
    ts: dataStreamedEvents.ts,
    tsFormat: convertValueToDate(dataStreamedEvents.ts)
  }))

  return {
    data,
    recordsFound: getRecordsFound(totalRecords)
  }
}
