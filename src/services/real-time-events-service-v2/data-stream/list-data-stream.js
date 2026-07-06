import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import { parseGraphQLResponse } from '@/services/real-time-events-service-v2/_shared/service/parse-graphql-response'
import { getCurrentTimezone } from '@/helpers'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

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

  return parseGraphQLResponse(response, adaptResponse)
}

const adapt = (filter) => {
  const table = {
    dataset: 'dataStreamedEvents',
    limit: filter?.pageSize || 500,
    ...(filter?.offset && { offset: filter.offset }),
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
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const data = response.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    configurationId: dataStreamedEvents.configurationId,
    id: generateCurrentTimestamp(),
    summary: buildSummary(dataStreamedEvents, shouldLimitRequestUri, shouldShowTsColumn),
    ts: dataStreamedEvents.ts,
    tsFormat: getCurrentTimezone(dataStreamedEvents.ts)
  }))

  return {
    data
  }
}
