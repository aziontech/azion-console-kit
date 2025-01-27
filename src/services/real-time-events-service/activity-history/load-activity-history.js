import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { capitalizeFirstLetter } from '@/helpers'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const loadActivityHistory = async (filter) => {
  const payload = adapt(filter)

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
    fields: ['title', 'type', 'ts', 'authorName', 'accountId', 'userId', 'authorEmail', 'comment'],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      userIdEq: filter.userId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [activityHistoryEvents = {}] = body.data.activityHistoryEvents

  return {
    title: activityHistoryEvents.title,
    type: capitalizeFirstLetter(activityHistoryEvents.type),
    ts: convertValueToDate(activityHistoryEvents.ts),
    authorName: activityHistoryEvents.authorName,
    accountId: activityHistoryEvents.accountId,
    userId: activityHistoryEvents.userId,
    authorEmail: activityHistoryEvents.authorEmail,
    comment: activityHistoryEvents.comment
  }
}
