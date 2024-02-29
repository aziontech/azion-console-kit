import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const listL2Cache = async (filter) => {
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

  return body.data.l2CacheEvents?.map((l2CacheEvents) => ({
    id: new Date().getTime(),
    bytesSent: l2CacheEvents.bytesSent,
    cacheKey: {
      content: l2CacheEvents.cacheKey
    },
    cacheTtl: l2CacheEvents.cacheTtl,
    clientId: l2CacheEvents.clientId,
    configurationId: l2CacheEvents.configurationId,
    host: l2CacheEvents.host,
    source: l2CacheEvents.source,
    proxyHost: l2CacheEvents.proxyHost,
    ts: l2CacheEvents.ts
  }))
}
