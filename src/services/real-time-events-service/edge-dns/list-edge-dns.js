import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

export const listEdgeDNS = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const levelMap = {
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
  DEBUG: {
    content: 'Debug',
    severity: 'success',
    icon: 'pi pi-check-circle'
  },
  TRACE: {
    content: 'Trace',
    severity: 'info',
    icon: 'pi pi-code'
  }
}

const getLevelDNS = (level) => {
  let words = level.trim().split(/\s+/)
  let firstWord = words[0]

  return levelMap[firstWord.toUpperCase()]
}

const adapt = (filter) => {
  const table = {
    dataset: 'idnsQueriesEvents',
    limit: 10000,
    fields: ['level', 'qtype', 'resolutionType', 'source', 'solutionId', 'ts', 'uuid', 'zoneId'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.idnsQueriesEvents?.map((edgeDnsQueriesEvents) => ({
    id: generateCurrentTimestamp(),
    level: getLevelDNS(edgeDnsQueriesEvents.level),
    qtype: edgeDnsQueriesEvents.qtype,
    resolutionType: edgeDnsQueriesEvents.resolutionType,
    source: edgeDnsQueriesEvents.source,
    solutionId: edgeDnsQueriesEvents.solutionId,
    ts: edgeDnsQueriesEvents.ts,
    uuid: edgeDnsQueriesEvents.uuid,
    zoneId: edgeDnsQueriesEvents.zoneId
  }))
}
