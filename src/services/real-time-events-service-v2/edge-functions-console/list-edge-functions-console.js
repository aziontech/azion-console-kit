import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { parseGraphQLResponse } from '@/services/real-time-events-service-v2/_shared/service/parse-graphql-response'
import { buildSummary } from '@/helpers'
import { getCurrentTimezone } from '@/helpers'
import { CURATED_DATASET_FIELDS } from '../_shared/dataset-fields'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

const DATASET = 'functionConsoleEvents'

export const listEdgeFunctionsConsole = async (filter) => {
  const fields = [...CURATED_DATASET_FIELDS[DATASET]]

  const payload = adapt(filter, fields)
  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return parseGraphQLResponse(httpResponse, adaptResponse)
}

const adapt = (filter, fields) => {
  const table = {
    dataset: DATASET,
    limit: filter?.pageSize || 500,
    ...(filter?.offset && { offset: filter.offset }),
    fields,
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (body) => {
  const functionConsoleEventsList = body.data?.[DATASET]
  const parser = functionConsoleEventsList?.length
    ? functionConsoleEventsList.map((functionConsoleEvent) => ({
        summary: buildSummary(functionConsoleEvent, shouldLimitRequestUri, shouldShowTsColumn),
        configurationId: functionConsoleEvent.configurationId,
        line: functionConsoleEvent.line,
        id: generateCurrentTimestamp(),
        tsFormat: getCurrentTimezone(functionConsoleEvent.ts),
        ts: functionConsoleEvent.ts
      }))
    : []

  return {
    data: parser
  }
}
