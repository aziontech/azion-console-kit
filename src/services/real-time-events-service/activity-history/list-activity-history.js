import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'

export const listActivityHistory = async (filter) => {
  const payload = adapt(filter)

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
    dataset: 'activityHistoryEvents',
    limit: 10000,
    fields: ['userIp', 'authorName', 'title', 'resourceType', 'resourceId', 'userId', 'ts'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.activityHistoryEvents?.map((activityHistoryEvents) => ({
    id: generateCurrentTimestamp(),
    userIp: activityHistoryEvents.userIp,
    authorName: activityHistoryEvents.authorName,
    title: activityHistoryEvents.title,
    resourceType: activityHistoryEvents.resourceType,
    resourceId: activityHistoryEvents.resourceId,
    userId: activityHistoryEvents.userId,
    ts: activityHistoryEvents.ts,
    tsFormat: convertValueToDate(activityHistoryEvents.ts)
  }))
}
