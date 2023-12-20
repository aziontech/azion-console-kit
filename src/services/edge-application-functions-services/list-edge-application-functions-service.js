import * as FunctionsInstanceService from '@/services/edge-application-functions-services'
import * as EdgeFunctionsService from '@/services/edge-functions-services'
import { parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'

const getFunctionInstances = async (edgeApplicationId) => {
  return FunctionsInstanceService.listFunctionsService({
    id: edgeApplicationId
  })
}

const getFunctionData = async (edgeApplicationFunction) => {
  return EdgeFunctionsService.loadEdgeFunctionsService({
    id: edgeApplicationFunction.edgeFunctionId
  })
}

const createFunctionsList = async (functionsInstances) => {
  return Promise.all(
    functionsInstances?.map(async (edgeApplicationFunction) => {
      let functionData = await getFunctionData(edgeApplicationFunction)

      return {
        id: edgeApplicationFunction.id,
        name: edgeApplicationFunction.name,
        languageIcon: functionData.languageIcon,
        referenceCount: functionData.referenceCount,
        initiatorType: functionData.initiatorType,
        lastEditor: functionData.lastEditor,
        modified: functionData.modified,
        statusTag: functionData.statusTag,
        version: functionData.version
      }
    })
  )
}

const adapt = (functionsList) => {
  return {
    body: functionsList,
    statusCode: 200
  }
}

export const listEdgeApplicationFunctionsService = async (edgeApplicationId) => {
  const functionsInstances = await getFunctionInstances(edgeApplicationId)
  const functionsList = await createFunctionsList(functionsInstances)
  const httpResponse = adapt(functionsList)

  return parseHttpResponse(httpResponse)
}
