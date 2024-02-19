import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadDataStreaming = async (filter) => {
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
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.dataStreamedEvents?.map((dataStreamedEvents) => ({
    url: dataStreamedEvents.url,
    jobName: dataStreamedEvents.jobName,
    ts: dataStreamedEvents.ts,
    streamedLines: dataStreamedEvents.streamedLines,
    dataStreamed: dataStreamedEvents.dataStreamed,
    configurationId: dataStreamedEvents.configurationId,
    source: dataStreamedEvents.source,
    endpointType: dataStreamedEvents.endpointType,
    statusCode: dataStreamedEvents.statusCode
  }))
}
