import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

export const loadEdgeDNS = async (filter) => {
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
    dataset: 'idnsQueriesEvents',
    limit: 10000,
    fields: [
      'level',
      'ts',
      'qtype',
      'uuid',
      'zoneId',
      'statusCode',
      'resolutionType',
      'solutionId',
      'source'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      uuidEq: filter.uuid,
      sourceEq: filter.source,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [edgeDnsQueriesEvents = {}] = body.data.idnsQueriesEvents

  return {
    ts: edgeDnsQueriesEvents.ts,
    qtype: edgeDnsQueriesEvents.qtype,
    data: buildSummary(edgeDnsQueriesEvents)
  }
}
