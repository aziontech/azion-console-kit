import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadHttpRequest = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const httpResponse = await decorator.request({
    url: '/events/graphql',
    method: 'POST',
    body: payload
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
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse

  return body.data.httpEvents?.map((httpEventItem) => {
    return {
      bytesSent: httpEventItem.bytesSent,
      configurationId: httpEventItem.configurationId,
      debugLog: httpEventItem.debugLog,
      geolocAsn: httpEventItem.geolocAsn,
      geolocCountryName: httpEventItem.geolocCountryName,
      geolocRegionName: httpEventItem.geolocRegionName,
      host: httpEventItem.host,
      ts: httpEventItem.ts
    }
  })
}
