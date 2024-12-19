import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { getRecordsFound } from '@/helpers/get-records-found'

export const listEdgeFunctions = async (filter) => {
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
    dataset: 'edgeFunctionsEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'functionLanguage',
      'edgeFunctionsInitiatorTypeList',
      'edgeFunctionsList',
      'edgeFunctionsTime',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const totalRecords = body.data.edgeFunctionsEvents?.length

  const data = body.data.edgeFunctionsEvents?.map((edgeFunctionsEvents) => ({
    id: generateCurrentTimestamp(),
    configurationId: edgeFunctionsEvents.configurationId,
    functionLanguage: edgeFunctionsEvents.functionLanguage,
    edgeFunctionsInitiatorTypeList: edgeFunctionsEvents.edgeFunctionsInitiatorTypeList,
    edgeFunctionsList: edgeFunctionsEvents.edgeFunctionsList.split(';'),
    edgeFunctionsTime: `${edgeFunctionsEvents.edgeFunctionsTime}ms`,
    ts: edgeFunctionsEvents.ts,
    tsFormat: convertValueToDate(edgeFunctionsEvents.ts)
  }))

  return {
    data,
    recordsFound: getRecordsFound(totalRecords)
  }
}
