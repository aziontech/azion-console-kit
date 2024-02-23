import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listHttpRequest = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    url: '/events/graphql',
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json; version=3'
    }
  })

  return adaptResponse(httpResponse)
}

const adapt = (filter) => {
  const table = {
    dataset: 'httpEvents',
    limit: 10000,
    fields: [
      'bytesSent',
      'configurationId',
      'debugLog',
      'geolocAsn',
      'geolocCountryName',
      'geolocRegionName',
      'host',
      'requestId',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse

  return body.data.httpEvents?.map((httpEventItem) => ({
    id: httpEventItem.ts + httpEventItem.configurationId + httpEventItem.requestId,
    bytesSent: httpEventItem.bytesSent,
    configurationId: httpEventItem.configurationId,
    debugLog: httpEventItem.debugLog,
    geolocAsn: httpEventItem.geolocAsn,
    geolocCountryName: httpEventItem.geolocCountryName,
    geolocRegionName: httpEventItem.geolocRegionName,
    host: httpEventItem.host,
    requestId: httpEventItem.requestId,
    ts: httpEventItem.ts
  }))
}
