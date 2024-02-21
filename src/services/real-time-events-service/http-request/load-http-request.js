import convertGQL from '@/helpers/convert-gql'
import { convertValueToDate } from '@/helpers/convert-date'
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
      'httpReferer',
      'scheme',
      'ts',
      'httpUserAgent',
      'remoteAddress',
      'host',
      'remotePort',
      'virtualhostId',
      'configurationId',
      'source',
      'requestTime',
      'tcpinfoRtt',
      'requestLength',
      'bytesSent',
      'sentHttpXOriginalImageSize',
      'sentHttpContentType',
      'requestId',
      'sslCipher',
      'requestMethod',
      'sslServerName',
      'requestUri',
      'sslProtocol',
      'proxyStatus',
      'sslSessionReused',
      'status',
      'wafScore',
      'wafTotalProcessed',
      'wafTotalBlocked',
      'wafEvheaders',
      'wafLearning',
      'wafBlock',
      'debugLog',
      'wafMatch',
      'sessionid',
      'geolocAsn',
      // 'stacktrace',
      'geolocCountryName'
    ],
    orderBy: 'ts_ASC'
  }

  const formatFilter = {
    tsRange: filter.tsRange,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts,
      requestIdEq: filter.requestId
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (httpResponse) => {
  const { body } = httpResponse
  const [httpEventItem = {}] = body.data.httpEvents
  return {
    id: httpEventItem.ts + httpEventItem.configurationId + httpEventItem.requestId,
    httpReferer: httpEventItem.httpReferer,
    scheme: httpEventItem.scheme?.toUpperCase(),
    ts: convertValueToDate(httpEventItem.ts),
    httpUserAgent: httpEventItem.httpUserAgent,
    remoteAddress: httpEventItem.remoteAddress,
    host: httpEventItem.host,
    remotePort: httpEventItem.remotePort,
    virtualhostId: httpEventItem.virtualhostId,
    configurationId: httpEventItem.configurationId,
    source: httpEventItem.source,
    requestTime: httpEventItem.requestTime,
    tcpinfoRtt: httpEventItem.tcpinfoRtt,
    requestLength: httpEventItem.requestLength,
    bytesSent: httpEventItem.bytesSent,
    sentHttpXOriginalImageSize: httpEventItem.sentHttpXOriginalImageSize,
    sentHttpContentType: httpEventItem.sentHttpContentType,
    requestId: httpEventItem.requestId,
    sslCipher: httpEventItem.sslCipher,
    requestMethod: httpEventItem.requestMethod,
    sslServerName: httpEventItem.sslServerName,
    requestUri: httpEventItem.requestUri,
    sslProtocol: httpEventItem.sslProtocol,
    proxyStatus: httpEventItem.proxyStatus,
    sslSessionReused: httpEventItem.sslSessionReused,
    status: httpEventItem.status,
    wafScore: httpEventItem.wafScore,
    wafTotalProcessed: httpEventItem.wafTotalProcessed,
    wafTotalBlocked: httpEventItem.wafTotalBlocked,
    wafEvheaders: httpEventItem.wafEvheaders,
    wafLearning: httpEventItem.wafLearning,
    wafBlock: httpEventItem.wafBlock,
    debugLog: httpEventItem.debugLog,
    wafMatch: httpEventItem.wafMatch,
    sessionid: httpEventItem.sessionid,
    geolocAsn: httpEventItem.geolocAsn,
    // stacktrace: httpEventItem.stacktrace,
    geolocCountryName: httpEventItem.geolocCountryName
  }
}
