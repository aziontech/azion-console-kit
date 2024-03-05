import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const loadEdgeFunctionsConsole = async (filter) => {
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
      sourceEq: filter.source,
      lineEq: filter.line,
      idEq: filter.id,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const levelMap = {
  DEBUG: {
    content: 'Debug',
    severity: 'success',
    icon: 'pi pi-check-circle'
  },
  ERROR: {
    content: 'Error',
    severity: 'danger',
    icon: 'pi pi-times-circle'
  },
  WARN: {
    content: 'Warning',
    severity: 'warning',
    icon: 'pi pi-exclamation-triangle'
  },
  INFO: {
    content: 'Info',
    severity: 'info',
    icon: 'pi pi-info-circle'
  },
  LOG: {
    content: 'Log',
    severity: 'info',
    icon: 'pi pi-code'
  },
  MDN: {
    content: 'MDN',
    severity: 'info',
    icon: 'pi pi-code'
  }
}

const adaptResponse = (response) => {
  const { body } = response
  const [cellsConsoleEvents = {}] = body.data.cellsConsoleEvents

  return {
    lineSource: cellsConsoleEvents.lineSource,
    level: levelMap[cellsConsoleEvents.level],
    ts: convertValueToDate(cellsConsoleEvents.ts),
    line: cellsConsoleEvents.line,
    id: cellsConsoleEvents.id,
    solutionId: cellsConsoleEvents.solutionId,
    functionId: cellsConsoleEvents.functionId,
    configurationId: cellsConsoleEvents.configurationId,
    source: cellsConsoleEvents.source
  }
}
