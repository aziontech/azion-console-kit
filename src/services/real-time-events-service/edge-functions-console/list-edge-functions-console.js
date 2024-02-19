import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listEdgeFunctionsConsole = async (filter) => {
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
    dataset: 'cellsConsoleEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'functionId',
      'id',
      'level',
      'line',
      'lineSource',
      'solutionId',
      'source',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.cellsConsoleEvents?.map((cellsConsoleEvents) => ({
    configurationId: cellsConsoleEvents.configurationId,
    functionId: cellsConsoleEvents.functionId,
    id: cellsConsoleEvents.id,
    level: cellsConsoleEvents.level,
    line: cellsConsoleEvents.line,
    lineSource: cellsConsoleEvents.lineSource,
    solutionId: cellsConsoleEvents.solutionId,
    source: cellsConsoleEvents.source,
    ts: cellsConsoleEvents.ts
  }))
}
