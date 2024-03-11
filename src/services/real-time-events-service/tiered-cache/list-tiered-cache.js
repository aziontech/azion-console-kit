import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

export const listTieredCache = async (filter) => {
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
    dataset: 'l2CacheEvents',
    limit: 10000,
    fields: [
      'bytesSent',
      'cacheKey',
      'cacheTtl',
      'clientId',
      'configurationId',
      'host',
      'proxyHost',
      'source',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.l2CacheEvents?.map((tieredCacheEvents) => ({
    id: generateCurrentTimestamp(),
    bytesSent: tieredCacheEvents.bytesSent,
    cacheKey: {
      content: tieredCacheEvents.cacheKey
    },
    cacheTtl: tieredCacheEvents.cacheTtl,
    clientId: tieredCacheEvents.clientId,
    configurationId: tieredCacheEvents.configurationId,
    host: tieredCacheEvents.host,
    source: tieredCacheEvents.source,
    proxyHost: tieredCacheEvents.proxyHost,
    ts: tieredCacheEvents.ts
  }))
}
