import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listDataStreaming = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: '/events/graphql',
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json; version=3'
    }
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
    configurationId: dataStreamedEvents.configurationId,
    dataStreamed: dataStreamedEvents.dataStreamed,
    endpointType: dataStreamedEvents.endpointType,
    jobName: dataStreamedEvents.jobName,
    source: dataStreamedEvents.source,
    statusCode: dataStreamedEvents.statusCode,
    streamedLines: dataStreamedEvents.streamedLines,
    ts: dataStreamedEvents.ts
  }))
}
