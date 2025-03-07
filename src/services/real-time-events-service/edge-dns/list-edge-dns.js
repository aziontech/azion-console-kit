import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'

export const listEdgeDNS = async (filter) => {
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
    dataset: 'idnsQueriesEvents',
    limit: 10000,
    fields: [
      'level',
      'zoneId',
      'qtype',
      'resolutionType',
      'solutionId',
      'ts',
      'uuid',
      'statusCode',
      'version'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.idnsQueriesEvents?.map((edgeDnsQueriesEvents) => ({
    id: generateCurrentTimestamp(),
    summary: buildSummary(edgeDnsQueriesEvents),
    ts: edgeDnsQueriesEvents.ts,
    tsFormat: convertValueToDate(edgeDnsQueriesEvents.ts),
    uuid: edgeDnsQueriesEvents.uuid
  }))

  return {
    data
  }
}
