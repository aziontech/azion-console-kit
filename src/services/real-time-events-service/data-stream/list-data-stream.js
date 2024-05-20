import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

export const listDataStream = async (filter) => {
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
      'jobName',
      'endpointType',
      'url',
      'statusCode',
      'ts',
      'dataStreamed',
      'source',
      'streamedLines'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    id: generateCurrentTimestamp(),
    configurationId: dataStreamedEvents.configurationId,
    jobName: {
      content: dataStreamedEvents.jobName,
      severity: 'info'
    },
    endpointType: {
      content: dataStreamedEvents.endpointType,
      severity: 'info'
    },
    url: dataStreamedEvents.url,
    statusCode: dataStreamedEvents.statusCode,
    ts: dataStreamedEvents.ts,
    dataStreamed: dataStreamedEvents.dataStreamed,
    source: dataStreamedEvents.source,
    streamedLines: dataStreamedEvents.streamedLines,
    tsFormat: convertValueToDate(dataStreamedEvents.ts)
  }))
}
