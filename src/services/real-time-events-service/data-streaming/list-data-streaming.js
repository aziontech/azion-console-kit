import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const listDataStreaming = async (filter) => {
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
      'configurationId',
      'dataStreamed',
      'endpointType',
      'jobName',
      'source',
      'statusCode',
      'streamedLines',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    id: new Date().getTime(),
    configurationId: dataStreamedEvents.configurationId,
    dataStreamed: dataStreamedEvents.dataStreamed,
    endpointType: {
      content: dataStreamedEvents.endpointType,
      severity: 'info'
    },
    jobName: {
      content: dataStreamedEvents.jobName,
      severity: 'info'
    },
    source: dataStreamedEvents.source,
    statusCode: dataStreamedEvents.statusCode,
    streamedLines: dataStreamedEvents.streamedLines,
    ts: dataStreamedEvents.ts,
    tsFormat: convertValueToDate(dataStreamedEvents.ts)
  }))
}
