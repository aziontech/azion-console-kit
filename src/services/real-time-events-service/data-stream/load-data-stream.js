import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const loadDataStream = async (filter) => {
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
    dataset: 'dataStreamedEvents',
    limit: 10000,
    fields: [
      'url',
      'jobName',
      'ts',
      'streamedLines',
      'dataStreamed',
      'configurationId',
      'source',
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
    streamedLines: dataStreamedEvents.streamedLines,
    dataStreamed: dataStreamedEvents.dataStreamed,
    configurationId: dataStreamedEvents.configurationId,
    source: dataStreamedEvents.source,
    statusCode: dataStreamedEvents.statusCode,
    endpointType: dataStreamedEvents.endpointType,
    jobName: {
      content: dataStreamedEvents.jobName,
      severity: 'info'
    }
  }
}
