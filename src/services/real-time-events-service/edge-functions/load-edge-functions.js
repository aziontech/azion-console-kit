import { convertGQL } from '@/helpers/convert-gql'
import { getCurrentTimezone } from '@/helpers'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { buildSummary } from '@/helpers'

const shouldShowTsColumn = true

export const loadEdgeFunctions = async (filter) => {
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
    dataset: 'functionEvents',
    limit: 10000,
    fields: [
      'functionLanguage',
      'ts',
      'edgeFunctionsList',
      'edgeFunctionsTime',
      'edgeFunctionsInitiatorTypeList',
      'edgeFunctionsInstanceIdList',
      'edgeFunctionsSolutionId',
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
  const [functionEvents = {}] = body.data.functionEvents
  functionEvents.edgeFunctionsList = functionEvents.edgeFunctionsList?.split(';')

  return {
    id: functionEvents.ts + functionEvents.configurationId,
    data: buildSummary(functionEvents, false, shouldShowTsColumn),
    functionLanguage: functionEvents.functionLanguage,
    ts: getCurrentTimezone(functionEvents.ts)
  }
}
