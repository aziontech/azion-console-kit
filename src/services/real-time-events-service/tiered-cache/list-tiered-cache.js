import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { convertValueToDate } from '@/helpers'
import { useGraphQLStore } from '@/stores/graphql-query'
import { getRecordsFound } from '@/helpers/get-records-found'

export const listTieredCache = async (filter) => {
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
    dataset: 'l2CacheEvents',
    limit: 10000,
    fields: [
      'configurationId',
      'host',
      'requestUri',
      'requestMethod',
      'upstreamCacheStatus',
      'ts',
      'proxyHost',
      'source'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const totalRecords = body.data.l2CacheEvents?.length

  const data = body.data.l2CacheEvents?.map((tieredCacheEvents) => ({
    id: generateCurrentTimestamp(),
    configurationId: tieredCacheEvents.configurationId,
    host: tieredCacheEvents.host,
    requestUri: tieredCacheEvents.requestUri,
    requestMethod: tieredCacheEvents.requestMethod,
    upstreamCacheStatus: {
      content: tieredCacheEvents.upstreamCacheStatus,
      severity: 'info'
    },
    ts: tieredCacheEvents.ts,
    proxyHost: tieredCacheEvents.proxyHost,
    source: tieredCacheEvents.source,
    tsFormat: convertValueToDate(tieredCacheEvents.ts)
  }))

  return {
    data,
    recordsFound: getRecordsFound(totalRecords)
  }
}
