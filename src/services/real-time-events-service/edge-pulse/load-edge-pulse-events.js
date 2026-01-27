import { convertGQL } from '@/helpers/convert-gql'
import { getCurrentTimezone } from '@/helpers'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

export const loadEdgePulse = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    baseURL: '/',
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'edgePulseEvents',
    limit: 10000,
    fields: [
      'ts',
      'clientId',
      'scriptid',
      'platform',
      'referrer',
      'locationhref',
      'useragent',
      'type',
      'browser',
      'rtt',
      'downlink',
      'effectivetype',
      'typebackforward',
      'typereserved',
      'typenavigate',
      'contentdownload',
      'ssl',
      'networkduration',
      'tcp',
      'rendertime',
      'dns',
      'redirectcount',
      'navtype',
      'typereload',
      'ttfb',
      'pageloadtime'
    ],
    orderBy: 'ts_ASC'
  }
  const formatFilter = {
    tsRange: filter.tsRange,
    fields: filter.fields,
    and: {
      configurationIdEq: filter.configurationId,
      tsEq: filter.ts
    }
  }
  return convertGQL(formatFilter, table)
}

const adaptResponse = (response) => {
  const { body } = response
  const [edgeDnsEvents = {}] = body.data.edgeDnsEvents
  edgeDnsEvents.edgeDnsList = edgeDnsEvents.edgeDnsList?.split(';')

  return {
    id: edgeDnsEvents.ts + edgeDnsEvents.configurationId,
    data: buildSummary(edgeDnsEvents),
    ts: getCurrentTimezone(edgeDnsEvents.ts)
  }
}
