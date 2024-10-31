import * as FunctionsInstanceService from '@/services/edge-application-functions-services/v4'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
let count = 0

const listFunctionInstances = async (edgeApplicationID, query) => {
  return FunctionsInstanceService.listFunctionsService({
    id: edgeApplicationID,
    ...query
  })
}

const getFunctionData = async (edgeApplicationFunction) => {
  return EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeApplicationFunction.edgeFunctionId
  })
}

const listFunctionInstancesAndFunctionData = async (functionsInstances) => {
  if (!functionsInstances.length) {
    return []
  }
  return Promise.all(
    functionsInstances?.map(async (edgeApplicationFunction) => {
      let functionData = await getFunctionData(edgeApplicationFunction)
      return mapFunctionData(edgeApplicationFunction, functionData)
    })
  )
}

export const listEdgeApplicationFunctionsService = async (edgeApplicationID, query) => {
  const functionsInstances = await listFunctionInstances(edgeApplicationID, query)
  count = functionsInstances?.count || 0
  const functionData = functionsInstances?.body || functionsInstances

  const functions = await listFunctionInstancesAndFunctionData(functionData)
  const httpResponse = adapt(functions)

  return parseHttpResponse(httpResponse)
}

const mapFunctionData = (edgeApplicationFunction, functionData) => {
  return {
    id: edgeApplicationFunction.id,
    name: edgeApplicationFunction.name,
    functionInstanced: functionData.name,
    lastEditor: functionData.lastEditor,
    modified: functionData.modified,
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
