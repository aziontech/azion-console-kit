import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listL2Cache = async (filter) => {
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
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.l2CacheEvents?.map((l2CacheEvents) => ({
    bytesSent: l2CacheEvents.bytesSent,
    cacheKey: l2CacheEvents.cacheKey,
    cacheTtl: l2CacheEvents.cacheTtl,
    clientId: l2CacheEvents.clientId,
    configurationId: l2CacheEvents.configurationId,
    host: l2CacheEvents.host,
    proxyHost: l2CacheEvents.proxyHost,
    ts: l2CacheEvents.ts
  }))
}
