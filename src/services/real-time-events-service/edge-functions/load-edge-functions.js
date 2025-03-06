import convertGQL from '@/helpers/convert-gql'
import { convertValueToDate } from '@/helpers/convert-date'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

export const loadEdgeFunctions = async (filter) => {
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
    dataset: 'edgeFunctionsEvents',
    limit: 10000,
    fields: [
      'functionLanguage',
      'ts',
      'edgeFunctionsList',
      'edgeFunctionsTime',
      'edgeFunctionsInitiatorTypeList',
      'edgeFunctionsInstanceIdList',
      'edgeFunctionsSolutionId',
      'source',
      'virtualhostid',
      'configurationId'
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
  const [edgeFunctionsEvents = {}] = body.data.edgeFunctionsEvents
  edgeFunctionsEvents.edgeFunctionsList = edgeFunctionsEvents.edgeFunctionsList?.split(';')

  return {
    id: edgeFunctionsEvents.ts + edgeFunctionsEvents.configurationId,
    data: buildSummary(edgeFunctionsEvents),
    functionLanguage: edgeFunctionsEvents.functionLanguage,
    ts: convertValueToDate(edgeFunctionsEvents.ts)
  }
}
