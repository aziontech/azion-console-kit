import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import { parseGraphQLResponse } from '@/services/real-time-events-service-v2/_shared/service/parse-graphql-response'
import { getCurrentTimezone } from '@/helpers'
import { CURATED_DATASET_FIELDS } from '../_shared/dataset-fields'

const shouldShowTsColumn = false
const shouldLimitRequestUri = true

const DATASET = 'activityHistoryEvents'

export const listActivityHistory = async (filter) => {
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

const adaptResponse = (response) => {
  const data = response.data[DATASET]?.map((activityHistoryEvents) => ({
    id: generateCurrentTimestamp(),
    summary: buildSummary(activityHistoryEvents, shouldLimitRequestUri, shouldShowTsColumn),
    userId: activityHistoryEvents.userId,
    ts: activityHistoryEvents.ts,
    tsFormat: getCurrentTimezone(activityHistoryEvents.ts)
  }))

  return {
    data
  }
}
