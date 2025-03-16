import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { convertValueToDateByUserTimezone } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'
import { getUserTimezone } from '../get-timezone'

export const loadDataStream = async (filter) => {
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
    dataset: 'dataStreamedEvents',
    limit: 10000,
    fields: [
      'url',
      'jobName',
      'ts',
      'streamedLines',
      'dataStreamed',
      'configurationId',
      'endpointType',
      'statusCode'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [dataStreamedEvents = {}] = body.data.dataStreamedEvents
  const timezone = getUserTimezone()

  return {
    url: dataStreamedEvents.url,
    ts: convertValueToDateByUserTimezone(dataStreamedEvents.ts, timezone),
    jobName: {
      content: dataStreamedEvents.jobName,
      severity: 'info'
    },
    data: buildSummary(dataStreamedEvents)
  }
}
