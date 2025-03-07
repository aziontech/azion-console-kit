import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

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

  return {
    url: dataStreamedEvents.url,
    ts: convertValueToDate(dataStreamedEvents.ts),
    jobName: {
      content: dataStreamedEvents.jobName,
      severity: 'info'
    },
    data: buildSummary(dataStreamedEvents)
  }
}
