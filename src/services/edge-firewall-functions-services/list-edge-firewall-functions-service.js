import * as FunctionsInstanceService from '@/services/edge-firewall-functions-services/list-functions-service'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'

const listFunctionInstances = async (edgeFirewallID) => {
  return FunctionsInstanceService.listFunctionsService({
    edgeFirewallID
  })
}

const getFunctionData = async (edgeFirewallFunction) => {
  return EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeFirewallFunction.edgeFunctionId
  })
}

const listFunctionInstancesAndFunctionData = async (functionsInstances) => {
  return Promise.all(
    functionsInstances?.map(async (edgeFirewallFunction) => {
      let functionData = await getFunctionData(edgeFirewallFunction)
      return mapFunctionData(edgeFirewallFunction, functionData)
    })
  )
}

export const listEdgeFirewallFunctionsService = async (edgeFirewallID) => {
  const functionsInstances = await listFunctionInstances(edgeFirewallID)
  const functions = await listFunctionInstancesAndFunctionData(functionsInstances)
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
    body: functions,
    statusCode: 200
  }
}
