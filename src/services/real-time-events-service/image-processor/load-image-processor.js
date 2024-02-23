import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'

export const loadImageProcessor = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: '/events/graphql',
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'imagesProcessedEvents',
    limit: 10000,
    fields: [
      'bytesSent',
      'configurationId',
      'host',
      'httpReferer',
      'httpUserAgent',
      'referenceError',
      'remoteAddr',
      'remoteAddressClass',
      'remotePort',
      'requestMethod',
      'requestTime',
      'requestUri',
      'scheme',
      'solution',
      'sslCipher',
      'sslProtocol',
      'sslSessionReused',
      'status',
      'tcpinfoRtt',
      'ts',
      'upstreamCacheStatus',
      'upstreamResponseTime',
      'upstreamResponseTimeStr',
      'upstreamStatus',
      'upstreamStatusStr'
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

const adaptResponse = (response) => {
  const { body } = response
  const [imagesProcessedEvents = {}] = body.data.imagesProcessedEvents
  return {
    bytesSent: imagesProcessedEvents.bytesSent,
    configurationId: imagesProcessedEvents.configurationId,
    host: imagesProcessedEvents.host,
    httpReferer: imagesProcessedEvents.httpReferer,
    httpUserAgent: imagesProcessedEvents.httpUserAgent,
    referenceError: imagesProcessedEvents.referenceError,
    remoteAddr: imagesProcessedEvents.remoteAddr,
    remoteAddressClass: imagesProcessedEvents.remoteAddressClass,
    remotePort: imagesProcessedEvents.remotePort,
    requestMethod: imagesProcessedEvents.requestMethod,
    requestTime: imagesProcessedEvents.requestTime,
    requestUri: imagesProcessedEvents.requestUri,
    scheme: imagesProcessedEvents.scheme?.toUpperCase(),
    solution: imagesProcessedEvents.solution,
    sslCipher: imagesProcessedEvents.sslCipher,
    sslProtocol: imagesProcessedEvents.sslProtocol,
    sslSessionReused: imagesProcessedEvents.sslSessionReused,
    status: imagesProcessedEvents.status,
    tcpinfoRtt: imagesProcessedEvents.tcpinfoRtt,
    ts: convertValueToDate(imagesProcessedEvents.ts),
    upstreamCacheStatus: imagesProcessedEvents.upstreamCacheStatus,
    upstreamResponseTime: imagesProcessedEvents.upstreamResponseTime,
    upstreamResponseTimeStr: imagesProcessedEvents.upstreamResponseTimeStr,
    upstreamStatus: imagesProcessedEvents.upstreamStatus,
    upstreamStatusStr: imagesProcessedEvents.upstreamStatusStr
  }
}
