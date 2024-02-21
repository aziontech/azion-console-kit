import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadIntelligentDNS = async (filter) => {
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
    and: {
      uuidEq: filter.uuid,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.idnsQueriesEvents?.map((idnsQueriesEvents) => ({
    level: idnsQueriesEvents.level,
    ts: idnsQueriesEvents.ts,
    qtype: idnsQueriesEvents.qtype,
    uuid: idnsQueriesEvents.uuid,
    zoneId: idnsQueriesEvents.zoneId,
    statusCode: idnsQueriesEvents.statusCode,
    resolutionType: idnsQueriesEvents.resolutionType,
    solutionId: idnsQueriesEvents.solutionId,
    source: idnsQueriesEvents.source
  }))
}
