import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadActivityHistory = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: '/events/graphql',
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
    and: {
      userIdEq: filter.userId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.activityHistoryEvents?.map((activityHistoryEvents) => ({
    title: activityHistoryEvents.title,
    type: activityHistoryEvents.type,
    ts: activityHistoryEvents.ts,
    authorName: activityHistoryEvents.authorName,
    accountId: activityHistoryEvents.accountId,
    userId: activityHistoryEvents.userId,
    authorEmail: activityHistoryEvents.authorEmail,
    comment: activityHistoryEvents.comment
  }))
}
