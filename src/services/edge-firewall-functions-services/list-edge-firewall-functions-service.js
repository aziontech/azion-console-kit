import * as FunctionsInstanceServiceV4 from '@/services/edge-firewall-functions-services/v4'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
let count = 0
const listFunctionInstances = async (edgeFirewallID, query) => {
  return FunctionsInstanceServiceV4.listFunctionsService({
    edgeFirewallID,
    ...query
  })
}

const getFunctionData = async (edgeFirewallFunction) => {
  return EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeFirewallFunction.edgeFunctionId
  })
}

const listFunctionInstancesAndFunctionData = async (functionsInstances) => {
  if (!functionsInstances.length) {
    return []
  }
  return Promise.all(
    functionsInstances?.map(async (edgeFirewallFunction) => {
      let functionData = await getFunctionData(edgeFirewallFunction)
      return mapFunctionData(edgeFirewallFunction, functionData)
    })
  )
}

export const listEdgeFirewallFunctionsService = async (edgeFirewallID, query) => {
  const functionsInstances = await listFunctionInstances(edgeFirewallID, query)
  count = functionsInstances?.count || 0
  const functionData = functionsInstances?.body || functionsInstances

  const functions = await listFunctionInstancesAndFunctionData(functionData)
  const httpResponse = adapt(functions)

  return parseHttpResponse(httpResponse)
}

const mapFunctionData = (edgeFirewallFunction, functionData) => {
  return {
    id: edgeFirewallFunction.id,
    name: edgeFirewallFunction.name,
    functionInstanced: functionData.name,
    lastEditor: edgeFirewallFunction.lastEditor,
    modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
      new Date(edgeFirewallFunction.lastModified)
    ),
    version: functionData.version
  }
}

const adapt = (functions) => {
  return {
    count,
    body: functions,
    statusCode: 200
  }
}
