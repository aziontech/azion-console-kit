import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'
import * as Errors from '@/services/axios/errors'
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

  return parseHttpResponse(httpResponse)
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

const parseHttpResponse = (response) => {
  const { body, statusCode } = response

  switch (statusCode) {
    case 200:
      return adaptResponse(body)
    case 400:
      const apiError = body.detail
      throw new Error(apiError).message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      const forbiddenError = body.detail
      throw new Error(forbiddenError).message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
