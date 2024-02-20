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

const checkLevel = (level) => {
  if (level === 'DEBUG') {
    return {
      content: 'Debug',
      severity: 'success',
      icon: 'pi pi-check-circle'
    }
  }
  if (level === 'ERROR') {
    return {
      content: 'Error',
      severity: 'danger',
      icon: 'pi pi-times-circle'
    }
  }
  if (level === 'WARN') {
    return {
      content: 'Warning',
      severity: 'warning',
      icon: 'pi pi-exclamation-triangle'
    }
  }

  if (level === 'INFO') {
    return {
      content: 'Info',
      severity: 'secondary',
      icon: 'pi pi-info-circle'
    }
  }

  return {
    content: level,
    severity: 'secondary',
    icon: 'pi pi-code'
  }
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.cellsConsoleEvents?.map((cellsConsoleEvents) => ({
    configurationId: cellsConsoleEvents.configurationId,
    functionId: cellsConsoleEvents.functionId,
    id: cellsConsoleEvents.id,
    level: checkLevel(cellsConsoleEvents.level),
    line: cellsConsoleEvents.line,
    lineSource: {
      content: cellsConsoleEvents.lineSource,
      severity: 'secondary'
    },
    solutionId: cellsConsoleEvents.solutionId,
    source: cellsConsoleEvents.source,
    ts: cellsConsoleEvents.ts
  }))
}
