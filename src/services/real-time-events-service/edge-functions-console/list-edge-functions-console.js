import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { getRecordsFound } from '@/helpers/get-records-found'

export const listEdgeFunctionsConsole = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

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
    fields: ['configurationId', 'functionId', 'id', 'level', 'line', 'lineSource', 'source', 'ts'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
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
  const totalRecords = body.data.cellsConsoleEvents?.length

  const data = body.data.cellsConsoleEvents?.map((cellsConsoleEvents) => ({
    configurationId: cellsConsoleEvents.configurationId,
    functionId: cellsConsoleEvents.functionId,
    id: generateCurrentTimestamp(),
    originalId: cellsConsoleEvents.id,
    level: levelMap[cellsConsoleEvents.level],
    line: cellsConsoleEvents.line,
    lineSource: {
      content: cellsConsoleEvents.lineSource,
      severity: 'info'
    },
    source: cellsConsoleEvents.source,
    tsFormat: convertValueToDate(cellsConsoleEvents.ts),
    ts: cellsConsoleEvents.ts
  }))

  return {
    data,
    recordsFound: getRecordsFound(totalRecords)
  }
}
