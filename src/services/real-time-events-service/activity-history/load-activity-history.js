import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { buildSummary, capitalizeFirstLetter } from '@/helpers'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { getCurrentTimezone } from '@/helpers'

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

const getSummaryValueByKey = (summary, key, fallback = '') => {
  if (!Array.isArray(summary) || !key) return fallback
  const entry = summary.find((item) => item?.key === key)
  return entry?.value ?? fallback
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
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      userIdEq: filter.userId,
      tsEq: filter.ts,
      titleEq: getSummaryValueByKey(filter.summary, 'title')
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
    ts: getCurrentTimezone(activityHistoryEvents.ts),
    data: buildSummary(activityHistoryEvents)
  }
}
