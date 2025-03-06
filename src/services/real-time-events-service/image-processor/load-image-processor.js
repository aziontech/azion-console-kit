import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { convertValueToDate } from '@/helpers/convert-date'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

export const loadImageProcessor = async (filter) => {
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
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts,
      httpUserAgentEq: filter.httpUserAgent,
      httpRefererEq: filter.httpReferer
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [imagesProcessedEvents = {}] = body.data.imagesProcessedEvents
  return {
    scheme: imagesProcessedEvents.scheme?.toUpperCase(),
    host: imagesProcessedEvents.host,
    ts: convertValueToDate(imagesProcessedEvents.ts),
    data: buildSummary(imagesProcessedEvents)
  }
}
