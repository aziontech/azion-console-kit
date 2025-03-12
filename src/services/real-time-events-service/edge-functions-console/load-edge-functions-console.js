import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { convertValueToDateByUserTimezone } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'
import { getUserTimezone } from '../get-timezone'

export const loadEdgeFunctionsConsole = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    baseURL: '/',
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
      'configurationId'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      lineEq: filter.line
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
  const timezone = getUserTimezone()

  return {
    lineSource: cellsConsoleEvents.lineSource,
    level: levelMap[cellsConsoleEvents.level],
    ts: convertValueToDateByUserTimezone(cellsConsoleEvents.ts, timezone),
    data: buildSummary(cellsConsoleEvents)
  }
}
