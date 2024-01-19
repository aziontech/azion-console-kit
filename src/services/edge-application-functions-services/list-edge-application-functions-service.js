import * as FunctionsInstanceService from '@/services/edge-application-functions-services'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'

const listFunctionInstances = async (edgeApplicationID) => {
  return FunctionsInstanceService.listFunctionsService({
    id: edgeApplicationID
  })
}

const getFunctionData = async (edgeApplicationFunction) => {
  return EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeApplicationFunction.edgeFunctionId
  })
}

const listFunctionInstancesAndFunctionData = async (functionsInstances) => {
  return Promise.all(
    functionsInstances?.map(async (edgeApplicationFunction) => {
      let functionData = await getFunctionData(edgeApplicationFunction)
      return mapFunctionData(edgeApplicationFunction, functionData)
    })
  )
}

export const listEdgeApplicationFunctionsService = async (edgeApplicationID) => {
  const functionsInstances = await listFunctionInstances(edgeApplicationID)
  const functions = await listFunctionInstancesAndFunctionData(functionsInstances)
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
    body: functions,
    statusCode: 200
  }
}
