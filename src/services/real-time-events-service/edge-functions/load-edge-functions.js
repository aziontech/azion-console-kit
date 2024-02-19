import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const loadEdgeFunctions = async (filter) => {
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
      'virtualHostId',
      'configurationId'
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

  return body.data.edgeFunctionsEvents?.map((edgeFunctionsEvents) => ({
    functionLanguage: edgeFunctionsEvents.functionLanguage,
    ts: edgeFunctionsEvents.ts,
    edgeFunctionsList: edgeFunctionsEvents.edgeFunctionsList,
    edgeFunctionsTime: edgeFunctionsEvents.edgeFunctionsTime,
    edgeFunctionsInitiatorTypeList: edgeFunctionsEvents.edgeFunctionsInitiatorTypeList,
    edgeFunctionsInstanceIdList: edgeFunctionsEvents.edgeFunctionsInstanceIdList,
    edgeFunctionsSolutionId: edgeFunctionsEvents.edgeFunctionsSolutionId,
    source: edgeFunctionsEvents.source,
    virtualHostId: edgeFunctionsEvents.virtualHostId,
    configurationId: edgeFunctionsEvents.configurationId
  }))
}
