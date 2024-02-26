import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

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
    fields: ['accountId', 'authorEmail', 'authorName', 'userId', 'title', 'comment', 'ts'],

    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.activityHistoryEvents?.map((activityHistoryEvents) => ({
    accountId: activityHistoryEvents.accountId,
    authorEmail: activityHistoryEvents.authorEmail,
    authorName: activityHistoryEvents.authorName,
    userId: activityHistoryEvents.userId,
    title: activityHistoryEvents.title,
    comment: activityHistoryEvents.comment,
    ts: activityHistoryEvents.ts
  }))
}
