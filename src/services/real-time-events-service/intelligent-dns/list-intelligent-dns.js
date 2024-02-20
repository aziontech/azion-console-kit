import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listIntelligentDNS = async (filter) => {
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
    dataset: 'idnsQueriesEvents',
    limit: 10000,
    fields: ['level', 'qtype', 'resolutionType', 'source', 'solutionId', 'ts', 'uuid', 'zoneID'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.idnsQueriesEvents?.map((idnsQueriesEvents) => ({
    level: idnsQueriesEvents.level,
    qtype: idnsQueriesEvents.qtype,
    resolutionType: idnsQueriesEvents.resolutionType,
    source: idnsQueriesEvents.source,
    solutionId: idnsQueriesEvents.solutionId,
    ts: idnsQueriesEvents.ts,
    uuid: idnsQueriesEvents.uuid,
    zoneId: idnsQueriesEvents.zoneId
  }))
}
