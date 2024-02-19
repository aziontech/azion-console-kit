import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadEdgeFunctionsConsole = async (filter) => {
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
    dataset: 'cellsConsoleEvents',
    limit: 10000,
    fields: [
      'lineSource',
      'level',
      'ts',
      'line',
      'id',
      'solutionId',
      'functionId',
      'configurationId',
      'source'
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

  return body.data.cellsConsoleEvents?.map((cellsConsoleEvents) => ({
    lineSource: cellsConsoleEvents.lineSource,
    level: cellsConsoleEvents.level,
    ts: cellsConsoleEvents.ts,
    line: cellsConsoleEvents.line,
    id: cellsConsoleEvents.id,
    solutionId: cellsConsoleEvents.solutionId,
    functionId: cellsConsoleEvents.functionId,
    configurationId: cellsConsoleEvents.configurationId,
    source: cellsConsoleEvents.source
  }))
}
