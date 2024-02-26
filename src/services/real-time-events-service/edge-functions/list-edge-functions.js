import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'

export const listEdgeFunctions = async (filter) => {
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
      'configurationId',
      'edgeFunctionsInstanceIdList',
      'edgeFunctionsInitiatorTypeList',
      'edgeFunctionsList',
      'edgeFunctionsSolutionId',
      'edgeFunctionsTime',
      'functionLanguage',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.edgeFunctionsEvents?.map((edgeFunctionsEvents) => ({
    configurationId: edgeFunctionsEvents.configurationId,
    edgeFunctionsInstanceIdList: edgeFunctionsEvents.edgeFunctionsInstanceIdList,
    edgeFunctionsInitiatorTypeList: edgeFunctionsEvents.edgeFunctionsInitiatorTypeList,
    edgeFunctionsList: edgeFunctionsEvents.edgeFunctionsList.split(';'),
    edgeFunctionsSolutionId: edgeFunctionsEvents.edgeFunctionsSolutionId,
    edgeFunctionsTime: edgeFunctionsEvents.edgeFunctionsTime,
    functionLanguage: edgeFunctionsEvents.functionLanguage,
    ts: edgeFunctionsEvents.ts
  }))
}
