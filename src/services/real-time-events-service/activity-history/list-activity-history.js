import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary } from '@/helpers'

export const listActivityHistory = async (filter) => {
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
    dataset: 'activityHistoryEvents',
    limit: 10000,
    fields: [
      'userIp',
      'authorName',
      'title',
      'resourceType',
      'resourceId',
      'userId',
      'ts',
      'comment',
      'authorEmail',
      'accountId',
      'requestData',
      'userAgent',
      'remotePort',
      'refererHeader'
    ],
    orderBy: 'ts_DESC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.activityHistoryEvents?.map((activityHistoryEvents) => ({
    id: generateCurrentTimestamp(),
    summary: buildSummary(activityHistoryEvents),
    userId: activityHistoryEvents.userId,
    ts: activityHistoryEvents.ts,
    tsFormat: convertValueToDate(activityHistoryEvents.ts)
  }))

  return {
    data
  }
}
