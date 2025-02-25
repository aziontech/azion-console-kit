import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'

export const listEdgeDNS = async (filter) => {
  const payload = adapt(filter)

  const graphqlStore = useGraphQLStore()
  graphqlStore.setQuery(payload)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    baseURL: '/',
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
    fields: ['level', 'zoneId', 'qtype', 'resolutionType', 'solutionId', 'ts', 'source', 'uuid'],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  const data = body.data.idnsQueriesEvents?.map((edgeDnsQueriesEvents) => ({
    id: generateCurrentTimestamp(),
    level: getLevelDNS(edgeDnsQueriesEvents.level),
    zoneId: edgeDnsQueriesEvents.zoneId,
    qtype: edgeDnsQueriesEvents.qtype,
    resolutionType: edgeDnsQueriesEvents.resolutionType,
    source: edgeDnsQueriesEvents.source,
    solutionId: edgeDnsQueriesEvents.solutionId,
    ts: edgeDnsQueriesEvents.ts,
    tsFormat: convertValueToDate(edgeDnsQueriesEvents.ts),
    uuid: edgeDnsQueriesEvents.uuid
  }))

  return {
    data
  }
}
